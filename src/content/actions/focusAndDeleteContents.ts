import { type ElementWrapper } from "../../typings/ElementWrapper";
import { type TalonAction } from "../../typings/RequestFromTalon";
import { isEditable } from "../utils/domUtils";

export async function focusAndDeleteContents(
	wrapper: ElementWrapper
): Promise<TalonAction[] | undefined> {
	if (
		wrapper.element instanceof HTMLInputElement ||
		wrapper.element instanceof HTMLTextAreaElement
	) {
		wrapper.element.select();
		wrapper.element.focus();

		return [{ name: "editDelete" }];
	}

	if (wrapper.element instanceof HTMLElement && isEditable(wrapper.element)) {
		await wrapper.click();

		if (wrapper.element.textContent) {
			const range = document.createRange();
			range.selectNodeContents(wrapper.element);

			const selection = window.getSelection();
			selection?.removeAllRanges();
			selection?.addRange(range);

			return [
				{ name: "sleep" },
				{
					name: "editDelete",
					main: true,
					previousName: "editDeleteAfterDelay",
				},
			];
		}
	}

	return undefined;
}
