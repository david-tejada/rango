import { assertDefined } from "../../typings/TypingUtils";
import { getTextNodeRect } from "../hints/layoutCache";
import { getWrapper } from "../wrappers";

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
			if (getWrapper(childNode)?.isHintable) {
				continue;
			}

			return getFirstTextNodeDescendant(childNode);
		}
	}

	return undefined;
}
