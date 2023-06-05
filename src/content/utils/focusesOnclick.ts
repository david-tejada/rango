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

	const contentEditable = element.getAttribute("contenteditable");
	if (contentEditable === "" || contentEditable === "true") {
		return true;
	}

	return false;
}
