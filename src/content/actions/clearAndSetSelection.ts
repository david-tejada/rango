import { ElementWrapper } from "../../typings/ElementWrapper";
import { focusesOnclick } from "../utils/focusesOnclick";

export function clearAndSetSelection(wrapper: ElementWrapper) {
	if (
		wrapper.element instanceof HTMLInputElement ||
		wrapper.element instanceof HTMLTextAreaElement
	) {
		wrapper.element.value = "";
		wrapper.element.focus();
	} else if (
		wrapper.element instanceof HTMLElement &&
		focusesOnclick(wrapper.element)
	) {
		wrapper.element.textContent = "";
		wrapper.element.focus();
	}
}
