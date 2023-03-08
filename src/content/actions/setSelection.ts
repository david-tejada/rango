import { ElementWrapper } from "../../typings/ElementWrapper";
import { assertDefined } from "../../typings/TypingUtils";

// Selection.modify is not part of any specification so we have to augment the
// Selection type
declare global {
	interface Selection {
		modify(s: string, t: string, u: string): void;
	}
}

export function setSelectionAtEdge(target: Element, atStart: boolean) {
	if (
		target instanceof HTMLInputElement ||
		target instanceof HTMLTextAreaElement
	) {
		const selectionOffset = atStart ? 0 : target.value.length;
		target.setSelectionRange(selectionOffset, selectionOffset);
	} else {
		const range = document.createRange();
		range.selectNodeContents(target);

		range.collapse(atStart);
		const selection = window.getSelection();
		assertDefined(selection);
		selection.removeAllRanges();
		selection.addRange(range);
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
