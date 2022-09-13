import { isFocusOnClickInput } from "../../typings/TypingUtils";

export function focusesOnclick(element: Element): boolean {
	if (isFocusOnClickInput(element)) {
		return true;
	}

	if (
		element instanceof HTMLTextAreaElement ||
		element instanceof HTMLSelectElement
	) {
		return true;
	}

	if (element.getAttribute("contenteditable") === "true") {
		return true;
	}

	return false;
}
