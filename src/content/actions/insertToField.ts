import { ElementWrapper } from "../../typings/ElementWrapper";
import { isFieldWithValue } from "../../typings/TypingUtils";
import { setSelectionAfter } from "./setSelection";

export function insertToField(wrappers: ElementWrapper[], text: string) {
	for (const wrapper of wrappers) {
		wrapper.hint?.flash();
		if (isFieldWithValue(wrapper.element)) {
			wrapper.element.value = text;
		} else if (wrapper.element.getAttribute("contenteditable") === "true") {
			wrapper.element.textContent = text;
		}
	}

	const lastWrapper = wrappers[wrappers.length - 1]!;
	setSelectionAfter(lastWrapper);
	if (lastWrapper.element instanceof HTMLElement) {
		lastWrapper.element.focus();
	}
}
