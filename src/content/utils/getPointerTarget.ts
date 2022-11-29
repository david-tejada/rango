import { getWrapper } from "../wrappers";
import { getElementCenter } from "./cssomUtils";

export function getPointerTarget(element: Element) {
	if (
		element.matches(
			"button, a, input, summary, textarea, select, option, label"
		)
	) {
		return element;
	}

	const { x, y } = getElementCenter(element);
	const elementsAtPoint = document.elementsFromPoint(x, y);

	for (const elementAt of elementsAtPoint) {
		if (element.contains(elementAt)) {
			let current: Element | null = elementAt;
			let differentWrapper = false;

			while (current || current === element) {
				const wrapper = getWrapper(current);
				if (wrapper?.isHintable && wrapper !== getWrapper(elementAt)) {
					differentWrapper = true;
				}

				current = current.parentElement;
			}

			if (!differentWrapper) {
				return elementAt;
			}
		}
	}

	return element;
}
