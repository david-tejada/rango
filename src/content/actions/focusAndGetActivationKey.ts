import { type ElementWrapper } from "../wrappers/ElementWrapper";
import { focus } from "./focus";

export function focusAndGetActivationKey(wrapper: ElementWrapper) {
	const success = focus(wrapper);
	if (!success) throw new Error("Failed to focus element");

	return getActivationKey(wrapper.element);
}

function getActivationKey(element: Element) {
	if (element instanceof HTMLInputElement) {
		switch (element.type) {
			case "button":
			case "submit":
			case "color":
			case "file":
			case "reset": {
				return "enter";
			}

			case "checkbox":
			case "radio": {
				return "space";
			}

			default: {
				return undefined;
			}
		}
	}

	return element.localName === "select" ? "space" : "enter";
}
