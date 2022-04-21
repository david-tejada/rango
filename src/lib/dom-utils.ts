import { ClickableType } from "../types/types";

// This function is here mostly for debugging purposes
export function getClickableType(element: Element): ClickableType {
	const clickableTags = ["BUTTON", "A", "INPUT", "SUMMARY"];
	const clickableRoles = ["button", "link", "treeitem", "tab"];
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

// This is very rudimentary and does not work all the time. A better approach would
// be to get the background color of the element being hinted and change the color
// of the hints individually
export function isPageDark() {
	const backgroundColor = window.getComputedStyle(
		document.body
	).backgroundColor;
	const [red, green, blue] = backgroundColor
		.replace(/[^\d,]/g, "")
		.split(",")
		.map((v) => Number(v));
	const luma = 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!;
	return luma < 40;
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
