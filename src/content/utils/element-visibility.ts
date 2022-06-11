import { Intersector } from "../../typing/types";
import {
	getFirstCharacterRect,
	getFirstTextNodeDescendant,
} from "./nodes-utils";

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

function isNotObscured(
	element: Element | undefined,
	cornerElement: Element | undefined
): boolean {
	if (!element || !cornerElement) {
		return false;
	}

	const containedWithinEachOther =
		element.contains(cornerElement) || cornerElement.contains(element);

	return Boolean(cornerElement.shadowRoot) || containedWithinEachOther;
}

// We cannot use something like z-index as all our hints are in the same absolutely
// positioned element, and thus, forming a new stacking context. So the stacking
// order of all our hints must be the same. We make use of elementFromPoint to know
// if an element is obscured. But we must be careful as this method is a bit slow.
export function elementIsObscured(intersector: Intersector): boolean {
	const element = intersector.element;
	intersector.firstTextNodeDescendant = intersector.firstTextNodeDescendant
		?.isConnected
		? intersector.firstTextNodeDescendant
		: getFirstTextNodeDescendant(intersector.element);
	const firstCharacterRect =
		getFirstCharacterRect(intersector.firstTextNodeDescendant) ??
		intersector.element.getBoundingClientRect();
	const rect = intersector.element.getBoundingClientRect();

	// Top left
	if (
		isNotObscured(
			element,
			getElementFromPoint(firstCharacterRect.x + 5, firstCharacterRect.y + 5)
		)
	) {
		return false;
	}

	// Bottom Left
	if (
		isNotObscured(
			element,
			getElementFromPoint(rect.x + 5, rect.y + rect.height - 5)
		)
	) {
		return false;
	}

	return true;
}
