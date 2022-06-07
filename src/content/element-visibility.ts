import { getFirstTextNodeRect } from "./nodes-utils";

function getElementFromPoint(x: number, y: number): Element | undefined {
	const elementsFromPoint = document.elementsFromPoint(x, y);
	for (const element of elementsFromPoint) {
		if (element.className !== "rango-hint") {
			return element;
		}
	}

	return undefined;
}

export function isVisible(element: Element): boolean {
	const rect = element.getBoundingClientRect();
	return (
		window.getComputedStyle(element).visibility !== "hidden" &&
		window.getComputedStyle(element).display !== "none" &&
		Number.parseFloat(window.getComputedStyle(element).opacity) > 0.1 &&
		rect.width + rect.height > 10
	);
}

export function elementIsObscured(element: Element): boolean {
	const firstCharacterRect =
		getFirstTextNodeRect(element, true) ?? element.getBoundingClientRect();
	const rect = element.getBoundingClientRect();
	const elementsFromPoint = [
		getElementFromPoint(firstCharacterRect.x + 5, firstCharacterRect.y + 5),
		getElementFromPoint(rect.x + rect.width - 5, rect.y + 5),
		getElementFromPoint(rect.x + 5, rect.y + rect.height - 5),
		getElementFromPoint(rect.x + rect.width - 5, rect.y + rect.height - 5),
	];

	for (const elementFromPoint of elementsFromPoint) {
		if (!elementFromPoint) {
			continue;
		}

		// For the time being if elementFromPoint is a shadow output we'll assume it's not obscured.
		// In the future we could use shadowRoot.elementFromPoint if it's necessary
		if (elementFromPoint.shadowRoot) {
			return false;
		}

		if (
			element.contains(elementFromPoint) ||
			elementFromPoint.contains(element)
		) {
			return false;
		}
	}

	return true;
}
