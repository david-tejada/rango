import { type ElementWrapper } from "../../typings/ElementWrapper";
import { hasPropertyValue } from "../../typings/TypingUtils";
import { setSelectionAfter } from "./setSelection";

export async function insertToField(wrappers: ElementWrapper[], text: string) {
	for (const wrapper of wrappers) {
		wrapper.hint?.flash();
		if (hasPropertyValue(wrapper.element)) {
			wrapper.element.value = text;
		} else if (wrapper.element.getAttribute("contenteditable") === "true") {
			wrapper.element.textContent = text;
		}
	}

	const lastWrapper = wrappers.at(-1)!;
	await setSelectionAfter(lastWrapper);
	if (lastWrapper.element instanceof HTMLElement) {
		lastWrapper.element.focus();
	}
}
