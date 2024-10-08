import { type ElementWrapper } from "../../typings/ElementWrapper";
import { assertDefined } from "../../typings/TypingUtils";
import { findFirstTextNode, findLastTextNode } from "../utils/nodeUtils";
import { activateEditable } from "../utils/activateEditable";

export function setSelectionAtEdge(target: Element, atStart: boolean) {
	if (
		target instanceof HTMLInputElement ||
		target instanceof HTMLTextAreaElement
	) {
		const selectionOffset = atStart ? 0 : target.value.length;
		target.setSelectionRange(selectionOffset, selectionOffset);
	} else {
		const textNode = atStart
			? findFirstTextNode(target)
			: findLastTextNode(target);

		const targetNode = textNode ? textNode.parentElement! : target;

		const range = document.createRange();
		range.selectNodeContents(targetNode);

		range.collapse(atStart);
		const selection = window.getSelection();
		assertDefined(selection);
		selection.removeAllRanges();
		selection.addRange(range);
	}
}

export async function setSelectionBefore(wrapper: ElementWrapper) {
	const editableWrapper = await activateEditable(wrapper);
	if (editableWrapper) setSelectionAtEdge(editableWrapper.element, true);
}

export async function setSelectionAfter(wrapper: ElementWrapper) {
	const editableWrapper = await activateEditable(wrapper);
	if (editableWrapper) setSelectionAtEdge(editableWrapper.element, false);
}
