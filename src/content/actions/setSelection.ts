import { sleep } from "../../lib/utils";
import { ElementWrapper } from "../../typings/ElementWrapper";
import { assertDefined } from "../../typings/TypingUtils";
import { elementIsEditable } from "../utils/domUtils";
import { findFirstTextNode, findLastTextNode } from "../utils/nodeUtils";
import { tryToFocusOnEditable } from "../utils/tryToFocusOnEditable";
import { getWrapperForElement } from "../wrappers/wrappers";

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

async function getWrapperForSelection(wrapper: ElementWrapper) {
	const activeElementIsEditable = await tryToFocusOnEditable(wrapper);
	await sleep(20);

	if (elementIsEditable(wrapper.element)) {
		return wrapper;
	}

	if (activeElementIsEditable) {
		const targetWrapper = getWrapperForElement(document.activeElement!);
		if (targetWrapper) return targetWrapper;
	}

	return undefined;
}

export async function setSelectionBefore(wrapper: ElementWrapper) {
	const editableWrapper = await getWrapperForSelection(wrapper);
	if (editableWrapper) setSelectionAtEdge(editableWrapper.element, true);
}

export async function setSelectionAfter(wrapper: ElementWrapper) {
	const editableWrapper = await getWrapperForSelection(wrapper);
	if (editableWrapper) setSelectionAtEdge(editableWrapper.element, false);
}
