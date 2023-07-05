import { TalonAction } from "../../typings/RequestFromTalon";
import { notify } from "../notify/notify";
import { dispatchKeyDown, dispatchKeyUp } from "../utils/dispatchEvents";
import { editableElementSelector } from "../utils/domUtils";
import { ElementWrapper } from "../../typings/ElementWrapper";
import { getWrapperForElement } from "../wrappers/wrappers";

const focusableSelector =
	"a, area[href], button, frame, iframe, input, object, select, textarea, summary, [tabindex]";

export function focus(wrappers: ElementWrapper[]): TalonAction[] | undefined {
	window.focus();

	for (const wrapper of wrappers) {
		if (document.activeElement) {
			dispatchKeyDown(document.activeElement, "Tab");
		}

		const focusable = wrapper.element.matches(focusableSelector)
			? wrapper.element
			: wrapper.element.querySelector(focusableSelector) ??
			  wrapper.element.closest(focusableSelector);

		if (focusable instanceof HTMLElement) {
			focusable.focus();
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

	const wrapper = getWrapperForElement(firstInput);
	if (wrapper) {
		focus([wrapper]);
	}
}

export function blur() {
	if (document.activeElement instanceof HTMLElement) {
		document.activeElement.blur();
	}
}
