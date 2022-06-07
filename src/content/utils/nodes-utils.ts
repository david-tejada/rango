import {
	isTextNode,
	isElementNode,
	assertDefined,
} from "../../typing/typing-utils";
import { getClickableType } from "./clickable-type";

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

export function getFirstTextNodeRect(
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
