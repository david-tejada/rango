import { hasDisabled } from "../../typings/TypingUtils";

export function isDisabled(element: Element) {
	if (element.getAttribute("aria-disabled") === "true") return true;

	if (
		element instanceof HTMLLabelElement &&
		element.control &&
		hasDisabled(element.control)
	) {
		return element.control.disabled;
	}

	if (hasDisabled(element)) {
		return element.disabled;
	}

	return false;
}
