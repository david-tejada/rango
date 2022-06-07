import Color from "color";
import { Intersector } from "../typing/types";
import {
	isTextNode,
	isElementNode,
	assertDefined,
} from "../typing/typing-utils";
import { isRgb, rgbaToRgb } from "./color-utils";

// This function is here mostly for debugging purposes
export function getClickableType(element: Element): string | undefined {
	// Ignoring some items that even though they have onclick event they don't do anything
	// or are redundant
	if (
		// SLACK
		(location.host === "app.slack.com" &&
			(element.className ===
				"p-channel_sidebar__static_list__item p-channel_sidebar__static_list__item--contain c-virtual_list__item" || // Does nothing
				element.getAttribute("role") === "toolbar")) || // Duplicate
		(element.tagName === "DIV" &&
			(element as HTMLElement).dataset["sk"] === "tooltip_parent") || // Duplicate
		// YOUTUBE
		(location.host === "www.youtube.com" &&
			element.className ===
				"yt-simple-endpoint style-scope ytd-toggle-button-renderer") || // Duplicate
		element.className === "style-scope ytd-guide-entry-renderer" ||
		element.className === "yt-simple-endpoint style-scope ytd-button-renderer" // Duplicate
	) {
		return undefined;
	}

	const clickableTags = new Set([
		"BUTTON",
		"A",
		"INPUT",
		"SUMMARY",
		"TEXTAREA",
		"SELECT",
		"OPTION",
		"LABEL",
	]);
	const clickableRoles = new Set([
		"button",
		"link",
		"treeitem",
		"tab",
		"option",
		"radio",
		"checkbox",
		"menuitem",
	]);
	const elementTag = element.tagName;
	const elementRole = element.getAttribute("role");

	if (clickableTags.has(elementTag)) {
		return elementTag.toLowerCase();
	}

	if (elementRole && clickableRoles.has(elementRole)) {
		let isRedundant = false;
		for (const child of element.children) {
			if (clickableTags.has(child.tagName)) {
				isRedundant = true;
			}
		}

		if (!isRedundant) {
			return elementRole;
		}
	}

	if ((element as HTMLElement).onclick !== null) {
		return "onclick";
	}

	return undefined;
}

export function focusesOnclick(element: Element): boolean {
	const focusableInputTypes = [
		"text",
		"search",
		"email",
		"week",
		"month",
		"password",
		"number",
		"range",
		"tel",
		"date",
		"time",
		"datetime",
		"datetime-local",
		"url",
	];

	if (
		element.tagName === "INPUT" &&
		(!element.getAttribute("type") ||
			focusableInputTypes.includes(element.getAttribute("type")!))
	) {
		return true;
	}

	if (element.tagName === "TEXTAREA" || element.tagName === "SELECT") {
		return true;
	}

	return false;
}

export function isVisible(element: Element): boolean {
	const rect = element.getBoundingClientRect();
	return (
		window.getComputedStyle(element).visibility !== "hidden" &&
		window.getComputedStyle(element).display !== "none" &&
		Number.parseFloat(window.getComputedStyle(element).opacity) > 0.1 &&
		rect.width + rect.height > 10
	);
}

export function hasTextNodesChildren(element: Element) {
	return [...element.childNodes].some(
		(node) => node.nodeType === 3 && /\S/.test(node.textContent!)
	);
}

// Inside some elements you can't get the coordinates of a text node with Range and
// instead you get the characters offset
function rangeGivesCoordinates(textNode: Text): boolean {
	const wrongRangeElements = new Set(["INPUT", "TEXTAREA", "title"]);
	assertDefined(textNode.parentElement);
	if (wrongRangeElements.has(textNode.parentElement.tagName)) {
		return false;
	}

	return true;
}

function getTextNodeRect(textNode: Text): DOMRect {
	const range = document.createRange();
	range.setStart(textNode, 0);
	range.setEnd(textNode, textNode.length);
	return range.getBoundingClientRect();
}

export function getFirstTextNodeDescendant(element: Node): Text | undefined {
	// Check to see if the element has any text content that is not white space
	if (!element.textContent || !/\S/.test(element.textContent)) {
		return undefined;
	}

	for (const childNode of element.childNodes) {
		assertDefined(childNode.textContent);
		if (
			isTextNode(childNode) &&
			rangeGivesCoordinates(childNode) &&
			/\S/.test(childNode.textContent)
		) {
			// We make sure here that the element isn't hidden using the -9999px trick
			const rect = getTextNodeRect(childNode);
			if (rect.y + rect.height > -500 && rect.x + rect.width > -500) {
				return childNode;
			}
		}

		if (isElementNode(childNode) && /\S/.test(childNode.textContent)) {
			// Sometimes we get a clickable element inside another clickable element. For example,
			// in the YouTube search suggestions every item is an element with role="option" and inside
			// those that represent previous searches a link element to remove said search,
			// positioned at the right end
			if (getClickableType(childNode)) {
				continue;
			}

			return getFirstTextNodeDescendant(childNode);
		}
	}

	return undefined;
}

function getFirstTextNodeRect(
	element: Element,
	onlyFirstCharacter = false
): DOMRect | undefined {
	const firstTextNodeDescendant = getFirstTextNodeDescendant(element);
	if (firstTextNodeDescendant) {
		const range = document.createRange();
		range.setStart(firstTextNodeDescendant, 0);
		range.setEnd(
			firstTextNodeDescendant,
			onlyFirstCharacter ? 1 : firstTextNodeDescendant.length
		);
		const rect = range.getBoundingClientRect();
		return rect.width === 0 && rect.height === 0 ? undefined : rect;
	}

	return undefined;
}

function getElementFromPoint(x: number, y: number): Element | undefined {
	const elementsFromPoint = document.elementsFromPoint(x, y);
	for (const element of elementsFromPoint) {
		if (element.className !== "rango-hint") {
			return element;
		}
	}

	return undefined;
}

export function elementIsObscured(element: Element): boolean {
	const firstCharacterRect =
		getFirstTextNodeRect(element, true) ?? element.getBoundingClientRect();
	const rect = element.getBoundingClientRect();
	const elementsFromPoint = [
		getElementFromPoint(firstCharacterRect.x + 5, firstCharacterRect.y + 5),
		getElementFromPoint(rect.x + rect.width - 5, rect.y + 5),
		getElementFromPoint(rect.x + 5, rect.y + rect.height - 5),
		getElementFromPoint(rect.x + rect.width - 5, rect.y + rect.height - 5),
	];

	for (const elementFromPoint of elementsFromPoint) {
		if (!elementFromPoint) {
			continue;
		}

		// For the time being if elementFromPoint is a shadow output we'll assume it's not obscured.
		// In the future we could use shadowRoot.elementFromPoint if it's necessary
		if (elementFromPoint.shadowRoot) {
			return false;
		}

		if (
			element.contains(elementFromPoint) ||
			elementFromPoint.contains(element)
		) {
			return false;
		}
	}

	return true;
}

function isHintThere(
	hintElement: HTMLDivElement,
	x: number,
	y: number
): boolean {
	const hintRect = hintElement.getBoundingClientRect();
	const bottomLeftElement = document.elementFromPoint(
		x,
		y + hintRect.height - 2
	);
	const bottomCenterElement = document.elementFromPoint(
		x + hintRect.width / 2,
		y + hintRect.height - 2
	);
	const bottomRightElement = document.elementFromPoint(
		x + hintRect.width,
		y + hintRect.height - 2
	);
	const centerElement = document.elementFromPoint(
		x + hintRect.width / 2,
		y + hintRect.height / 2
	);

	if (
		bottomLeftElement?.className === "rango-hint" ||
		bottomCenterElement?.className === "rango-hint" ||
		bottomRightElement?.className === "rango-hint" ||
		centerElement?.className === "rango-hint"
	) {
		return true;
	}

	return false;
}

export function positionHint(intersector: Intersector) {
	const element = intersector.element as HTMLElement;
	const hintElement = intersector.hintElement as HTMLDivElement;
	let rect;

	// With small buttons we just place the hint at the top left of the button,
	// no matter if they have text content or not. This gives a more consistent look
	if (
		element.tagName === "BUTTON" &&
		element.offsetHeight < hintElement.offsetHeight * 2.5
	) {
		rect = element.getBoundingClientRect();
	} else {
		// If the element has text, we situate the hint next to the first character
		// in case the text spans multiple lines
		rect =
			getFirstTextNodeRect(element, true) ?? element.getBoundingClientRect();
	}

	const scrollLeft =
		window.pageXOffset ||
		document.documentElement.scrollLeft ||
		document.body.scrollLeft;

	const scrollTop =
		window.pageYOffset ||
		document.documentElement.scrollTop ||
		document.body.scrollTop;

	const nudgeX = 0.3;
	const nudgeY = 0.4;

	let x = rect.left + scrollLeft - hintElement.offsetWidth * (1 - nudgeX);
	x = x > 0 ? x : 0;
	let y = rect.top + scrollTop - hintElement.offsetHeight * (1 - nudgeY);
	y = y > 0 ? y : 0;

	hintElement.style.left = `${x}px`;
	hintElement.style.top = `${y}px`;

	const anchorRect =
		getFirstTextNodeRect(element) ?? element.getBoundingClientRect();

	// Once the hint is at least 25% hidden, if there is space, we move it to the bottom left corner
	if (
		anchorRect &&
		hintElement.getBoundingClientRect().top < -hintElement.offsetHeight * 0.25
	) {
		let targetX = anchorRect.x - hintElement.offsetWidth * (1 - nudgeX);
		targetX = targetX > 0 ? targetX : 0;
		let targetY =
			anchorRect.y + anchorRect.height - hintElement.offsetHeight * nudgeY;
		targetY = targetY > 0 ? targetY : 0;

		if (!isHintThere(hintElement, targetX, targetY)) {
			hintElement.style.left = `${scrollLeft + targetX}px`;
			hintElement.style.top = `${scrollTop + targetY}px`;
		}
	}
}

export function getInheritedBackgroundColor(
	element: Element,
	defaultBackgroundColor: Color
): Color {
	const backgroundColor = new Color(
		window.getComputedStyle(element).backgroundColor || defaultBackgroundColor
	);

	if (
		backgroundColor.rgb().string() !== defaultBackgroundColor.rgb().string()
	) {
		if (isRgb(backgroundColor)) {
			return backgroundColor;
		}

		if (element.parentElement) {
			return rgbaToRgb(backgroundColor, getAscendantRgb(element.parentElement));
		}
	}

	if (!element.parentElement) return new Color("rgb(255, 255, 255)");

	return getInheritedBackgroundColor(
		element.parentElement,
		defaultBackgroundColor
	);
}

export function getDefaultBackgroundColor(): Color {
	// Have to add to the document in order to use getComputedStyle
	const div = document.createElement("div");
	document.head.append(div);
	const backgroundColor = window.getComputedStyle(div).backgroundColor;
	div.remove();
	return new Color(backgroundColor);
}

function getAscendantRgb(parent: HTMLElement): Color {
	if (parent === null) {
		return new Color("rgb(255, 255, 255)");
	}

	const parentBackgroundColor = new Color(
		window.getComputedStyle(parent).backgroundColor
	);
	if (isRgb(parentBackgroundColor)) {
		return parentBackgroundColor;
	}

	if (parent.parentElement) {
		return getAscendantRgb(parent.parentElement);
	}

	return new Color("rgb(255, 255, 255)");
}
