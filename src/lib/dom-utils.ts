import { ClickableType } from "../types/types";
import { isRgb, rgbaToRgb } from "./utils";

// This function is here mostly for debugging purposes
export function getClickableType(element: Element): ClickableType {
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

	const clickableTags = ["BUTTON", "A", "INPUT", "SUMMARY", "TEXTAREA"];
	const clickableRoles = [
		"button",
		"link",
		"treeitem",
		"tab",
		"option",
		"radio",
	];
	const elementTag = element.tagName;
	const elementRole = element.getAttribute("role");

	if (clickableTags.includes(elementTag)) {
		return elementTag.toLowerCase() as ClickableType;
	}

	if (elementRole && clickableRoles.includes(elementRole)) {
		return elementRole as ClickableType;
	}

	if ((element as HTMLElement).onclick !== null) {
		return "onclick";
	}

	return undefined;
}

export function focusesOnclick(element: Element): boolean {
	if (
		element.tagName === "INPUT" &&
		(element.getAttribute("type") === "text" ||
			element.getAttribute("type") === "search")
	) {
		return true;
	}

	if (element.tagName === "TEXTAREA") {
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

function getFirstTextNodeDescendant(element: Node): Node | undefined {
	// Check to see if the element has any text content that is not white space
	if (!/\S/.test(element.textContent!)) {
		return undefined;
	}

	if (element) {
		for (const childNode of element.childNodes) {
			if (childNode.nodeType === 3 && /\S/.test(childNode.textContent!)) {
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
	const firstCharacterRect = getFirstCharacterRect(element);
	const rect = firstCharacterRect ?? element.getBoundingClientRect();
	const paddingLeft = firstCharacterRect
		? 0
		: Number.parseInt(window.getComputedStyle(element).paddingLeft, 10);
	const paddingTop = firstCharacterRect
		? 0
		: Number.parseInt(window.getComputedStyle(element).paddingTop, 10);

	// I probably need to have these numbers depend on the font size
	let x = rect.left + window.scrollX + paddingLeft - 8 - (chars - 1) * 5;
	if (x < 0) {
		x = 0;
	}

	let y = rect.top + window.scrollY + paddingTop - 10;
	if (y < 0) {
		y = 0;
	}

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
	if (!isRgb(parentBackgroundColor) && parent.parentElement) {
		return getAscendantRgb(parent.parentElement);
	}

	return "rgb(255, 255, 255)";
}
