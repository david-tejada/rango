import { assertDefined } from "../../typings/TypingUtils";
import { isClickable } from "./isClickable";

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

export function getTextNodeRect(textNode: Text): DOMRect {
	const range = document.createRange();
	range.setStart(textNode, 0);
	range.setEnd(textNode, textNode.length);
	return range.getBoundingClientRect();
}

export function getFirstCharacterRect(textNode: Text): DOMRect | undefined {
	if (textNode) {
		const range = document.createRange();
		range.setStart(textNode, 0);
		range.setEnd(textNode, 1);
		const rect = range.getBoundingClientRect();
		return rect.width === 0 && rect.height === 0 ? undefined : rect;
	}

	return undefined;
}

export function getFirstTextNodeDescendant(element: Node): Text | undefined {
	// Check to see if the element has any text content that is not white space
	if (!element.textContent || !/\S/.test(element.textContent)) {
		return undefined;
	}

	for (const childNode of element.childNodes) {
		assertDefined(childNode.textContent);
		if (
			childNode instanceof Text &&
			rangeGivesCoordinates(childNode) &&
			/\S/.test(childNode.textContent)
		) {
			// We make sure here that the element isn't hidden using the -9999px trick
			const rect = getTextNodeRect(childNode);
			if (rect.y + rect.height > -500 && rect.x + rect.width > -500) {
				return childNode;
			}
		}

		if (childNode instanceof Element && /\S/.test(childNode.textContent)) {
			// Sometimes we get a clickable element inside another clickable element. For example,
			// in the YouTube search suggestions every item is an element with role="option" and inside
			// those that represent previous searches a link element to remove said search,
			// positioned at the right end
			if (isClickable(childNode)) {
				continue;
			}

			return getFirstTextNodeDescendant(childNode);
		}
	}

	return undefined;
}
