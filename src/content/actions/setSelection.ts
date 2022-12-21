import { ElementWrapper } from "../../typings/ElementWrapper";
import { assertDefined } from "../../typings/TypingUtils";

// Selection.modify is not part of any specification so we have to augment the
// Selection type
declare global {
	interface Selection {
		modify(s: string, t: string, u: string): void;
	}
}

function setSelectionAtEdge(target: Element, atStart: boolean) {
	if (
		target instanceof HTMLInputElement ||
		target instanceof HTMLTextAreaElement
	) {
		const selectionOffset = atStart ? 0 : target.value.length;
		target.setSelectionRange(selectionOffset, selectionOffset);
	} else if (target.textContent) {
		const range = document.createRange();
		range.selectNodeContents(target);

		// This doesn't work for Firefox when using selectNodeContents, it always
		// collapses to the start. It doesn't matter because we change the cursor
		// position with the call to selection.modify
		range.collapse(atStart);
		const selection = window.getSelection();
		assertDefined(selection);
		selection.removeAllRanges();
		selection.addRange(range);

		if (!atStart) selection.modify("move", "right", "line");
	}
}

export function setSelectionBefore(wrapper: ElementWrapper) {
	if (!(wrapper.element instanceof HTMLElement)) return;

	setSelectionAtEdge(wrapper.element, true);
	wrapper.element.focus();
}

export function setSelectionAfter(wrapper: ElementWrapper) {
	if (!(wrapper.element instanceof HTMLElement)) return;

	setSelectionAtEdge(wrapper.element, false);
	wrapper.element.focus();
}
