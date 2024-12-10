import { assertDefined } from "../../typings/TypingUtils";
import { findFirstTextNode, findLastTextNode } from "../dom/textNode";
import { type ElementWrapper } from "../wrappers/ElementWrapper";
import { activateEditable } from "./activateEditable";

export function setSelectionAtEdge(target: Element, atStart: boolean) {
	if (
		target instanceof HTMLInputElement ||
		target instanceof HTMLTextAreaElement
	) {
		// Some input types like `number` and `email` throw an error when setting
		// the selection range. In those cases we return false so that we can move
		// the cursor to the start of the line with talon.
		try {
			const selectionOffset = atStart ? 0 : target.value.length;
			target.setSelectionRange(selectionOffset, selectionOffset);
		} catch {
			return false;
		}
	} else {
		const textNode = atStart
			? findFirstTextNode(target)
			: findLastTextNode(target);

		const targetNode = textNode ? textNode.parentElement! : target;

		const range = document.createRange();
		range.selectNodeContents(targetNode);

		range.collapse(atStart);
		const selection = getSelection();
		assertDefined(selection);
		selection.removeAllRanges();
		selection.addRange(range);
	}

	return true;
}

/**
 * Set the selection to the start of the editable element.
 *
 * @returns `true` if the selection was set, `false` otherwise.
 *
 * @throws If no editable element was found.
 */
export async function setSelectionBefore(wrapper: ElementWrapper) {
	const editableWrapper = await activateEditable(wrapper);
	if (!editableWrapper) throw new Error("No editable element found");

	return setSelectionAtEdge(editableWrapper.element, true);
}

/**
 * Set the selection to the end of the editable element.
 *
 * @returns `true` if the selection was set, `false` otherwise.
 *
 * @throws If no editable element was found.
 */
export async function setSelectionAfter(wrapper: ElementWrapper) {
	const editableWrapper = await activateEditable(wrapper);
	if (!editableWrapper) throw new Error("No editable element found");

	return setSelectionAtEdge(editableWrapper.element, false);
}
