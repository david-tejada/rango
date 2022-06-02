import { getOption } from "../content/options";
import { isRgb, rgbaToRgb } from "./utils";

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

function rangeGivesCoordinates(element: Element): boolean {
	if (
		element.parentElement?.tagName === "INPUT" ||
		element.parentElement?.tagName === "TEXTAREA" ||
		element.parentElement?.tagName === "title"
	) {
		return false;
	}

	return true;
}

export function getFirstTextNodeDescendant(element: Node): Node | undefined {
	// Check to see if the element has any text content that is not white space
	if (!/\S/.test(element.textContent!)) {
		return undefined;
	}

	if (element) {
		for (const childNode of element.childNodes) {
			if (
				childNode.nodeType === 3 &&
				rangeGivesCoordinates(childNode as HTMLElement) &&
				/\S/.test(childNode.textContent!) &&
				childNode.parentElement!.getBoundingClientRect().left > 0 &&
				childNode.parentElement!.getBoundingClientRect().top > 0
			) {
				return childNode;
			}

			if (childNode.nodeType === 1) {
				if (getClickableType(childNode as HTMLElement)) {
					continue;
				}

				return getFirstTextNodeDescendant(childNode as Node);
			}
		}
	}

	return undefined;
}

function getFirstCharacterRect(element: Element): DOMRect | undefined {
	const firstTextNodeDescendant = getFirstTextNodeDescendant(element);
	if (firstTextNodeDescendant) {
		const range = document.createRange();
		range.setStart(firstTextNodeDescendant, 0);
		range.setEnd(firstTextNodeDescendant, 1);
		return range.getBoundingClientRect();
	}

	return undefined;
}

export function elementIsObscured(element: Element): boolean {
	const rect =
		getFirstCharacterRect(element) ?? element.getBoundingClientRect();

	const elementFromPoint = document.elementFromPoint(rect.x + 5, rect.y + 5);

	if (elementFromPoint?.className === "rango-hint") {
		return false;
	}

	// For the time being if elementFromPoint is a shadow output we'll assume it's not obscured.
	// In the future we could use shadowRoot.elementFromPoint if it's necessary
	if (elementFromPoint?.shadowRoot) {
		return false;
	}

	if (
		elementFromPoint &&
		(element.contains(elementFromPoint) || elementFromPoint.contains(element))
	) {
		return false;
	}

	return true;
}

export function calculateHintPosition(
	element: Element,
	chars: number
): [number, number] {
	// If the element has text, we situate the hint next to the first character
	const firstCharacterRect = getFirstCharacterRect(element);
	const rect = firstCharacterRect ?? element.getBoundingClientRect();

	const scrollLeft =
		window.pageXOffset ||
		document.documentElement.scrollLeft ||
		document.body.scrollLeft;

	const scrollTop =
		window.pageYOffset ||
		document.documentElement.scrollTop ||
		document.body.scrollTop;

	const hintFontSize = getOption("hintFontSize") as number;

	// This is not very scientific. Adjusted through trial and error
	let x = rect.left + scrollLeft - hintFontSize + 2 - (chars - 1) * 5;
	x = x > 0 ? x : 0;

	let y = rect.top + scrollTop - hintFontSize;
	y = y > 0 ? y : 0;

	return [x, y];
}

export function getInheritedBackgroundColor(
	element: Element,
	defaultBackgroundColor: string
): string {
	const backgroundColor = window.getComputedStyle(element).backgroundColor;

	if (backgroundColor !== defaultBackgroundColor) {
		if (isRgb(backgroundColor)) {
			return backgroundColor;
		}

		if (element.parentElement) {
			return rgbaToRgb(backgroundColor, getAscendantRgb(element.parentElement));
		}
	}

	if (!element.parentElement) return "rgb(255, 255, 255)";

	return getInheritedBackgroundColor(
		element.parentElement,
		defaultBackgroundColor
	);
}

export function getDefaultBackgroundColor(): string {
	// Have to add to the document in order to use getComputedStyle
	const div = document.createElement("div");
	document.head.append(div);
	const backgroundColor = window.getComputedStyle(div).backgroundColor;
	div.remove();
	return backgroundColor;
}

function getAscendantRgb(parent: HTMLElement): string {
	if (parent === null) {
		return "rgb(255, 255, 255)";
	}

	const parentBackgroundColor = window.getComputedStyle(parent).backgroundColor;
	if (isRgb(parentBackgroundColor)) {
		return parentBackgroundColor;
	}

	if (parent.parentElement) {
		return getAscendantRgb(parent.parentElement);
	}

	return "rgb(255, 255, 255)";
}
