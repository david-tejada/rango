import { dispatchKeyDown, dispatchKeyUp } from "../dom/dispatchEvents";
import { editableElementSelector, getFocusable } from "../dom/utils";
import { notify } from "../feedback/notify";
import {
	type ElementWrapper,
	getOrCreateWrapper,
} from "../wrappers/ElementWrapper";

/**
 * Focus an element. Returns a boolean indicating if a focus was performed.
 */
export function focus(wrapper: ElementWrapper) {
	window.focus();

	if (document.activeElement) {
		dispatchKeyDown(document.activeElement, "Tab");
	}

	const focusable = getFocusable(wrapper.element);

	if (focusable instanceof HTMLElement) {
		focusable.focus({ focusVisible: true });
		dispatchKeyUp(focusable, "Tab");
		return true;
	}

	return false;
}

export async function focusFirstInput() {
	const firstInput = document.querySelector(editableElementSelector);

	if (!firstInput) {
		await notify.error("No input found");
		return;
	}

	focus(getOrCreateWrapper(firstInput));
}

export function blur() {
	if (document.activeElement instanceof HTMLElement) {
		document.activeElement.blur();
	}
}
