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
		focusWithRetry(focusable);
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

/**
 * Focus an element. If after the focus the element is not the active element it
 * tries again. This is useful in cases were focusing an element focuses an
 * ancestor instead, e.g. file navigation in GitHub.
 */
function focusWithRetry(element: HTMLElement) {
	const retryTimes = 5;

	for (let i = 0; i < retryTimes; i++) {
		element.focus({ focusVisible: true });
		if (document.activeElement === element) {
			return;
		}
	}
}
