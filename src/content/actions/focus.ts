import { type TalonAction } from "../../typings/RequestFromTalon";
import { notify } from "../notify/notify";
import { dispatchKeyDown, dispatchKeyUp } from "../utils/dispatchEvents";
import { editableElementSelector, getFocusable } from "../utils/domUtils";
import { type ElementWrapper } from "../../typings/ElementWrapper";
import { getOrCreateWrapper } from "../wrappers/ElementWrapperClass";

export function focus(wrappers: ElementWrapper[]): TalonAction[] | undefined {
	window.focus();

	for (const wrapper of wrappers) {
		if (document.activeElement) {
			dispatchKeyDown(document.activeElement, "Tab");
		}

		const focusable = getFocusable(wrapper.element);

		if (focusable instanceof HTMLElement) {
			focusable.focus({ focusVisible: true });
			dispatchKeyUp(focusable, "Tab");
		}
	}

	if (!document.hasFocus()) {
		return [{ name: "focusPage" }];
	}

	return undefined;
}

export async function focusFirstInput() {
	const firstInput = document.querySelector(editableElementSelector);

	if (!firstInput) {
		await notify("No input found", { type: "error" });
		return;
	}

	focus([getOrCreateWrapper(firstInput)]);
}

export function blur() {
	if (document.activeElement instanceof HTMLElement) {
		document.activeElement.blur();
	}
}
