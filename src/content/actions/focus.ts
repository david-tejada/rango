import { TalonAction } from "../../typings/RequestFromTalon";
import { dispatchKeyDown, dispatchKeyUp } from "../utils/dispatchEvents";
import { Wrapper } from "../wrappers/Wrapper";

const focusableSelector =
	"a, area[href], button, frame, iframe, input, object, select, textarea, summary, [tabindex]";

export function focus(wrappers: Wrapper[]): TalonAction | undefined {
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
		return { type: "focusPage" };
	}

	return undefined;
}

export function blur() {
	if (document.activeElement instanceof HTMLElement) {
		document.activeElement.blur();
	}
}
