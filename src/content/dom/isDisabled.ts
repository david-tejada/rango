import { hasPropertyDisabled } from "../../typings/TypingUtils";

export function isDisabled(element: Element) {
	if (element.getAttribute("aria-disabled") === "true") return true;

	if (
		element instanceof HTMLLabelElement &&
		element.control &&
		hasPropertyDisabled(element.control)
	) {
		return element.control.disabled;
	}

	if (hasPropertyDisabled(element)) {
		return element.disabled;
	}

	return false;
}
