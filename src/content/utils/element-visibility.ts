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
export function elementIsVisible(intersector: Intersector): boolean {
	const element = intersector.element as HTMLElement;

	if (
		window.getComputedStyle(element).visibility === "hidden" ||
		window.getComputedStyle(element).display === "none" ||
		Number.parseFloat(window.getComputedStyle(element).opacity) < 0.1
	) {
		return false;
	}

	intersector.firstTextNodeDescendant = intersector.firstTextNodeDescendant
		?.isConnected
		? intersector.firstTextNodeDescendant
		: getFirstTextNodeDescendant(intersector.element);

	// If before the first element with text comes an image we use that to calculate
	// if the element is visible. We store the values because we need them to place the hint.
	// We store some of the values calculated because we need them to calculate the hint position
	const firstImage = element.querySelector("svg, img");
	if (
		firstImage &&
		window.getComputedStyle(firstImage).visibility !== "hidden" &&
		window.getComputedStyle(firstImage).display !== "none" &&
		Number.parseFloat(window.getComputedStyle(firstImage).opacity) > 0.1 &&
		(!intersector.firstTextNodeDescendant ||
			firstImage.compareDocumentPosition(
				intersector.firstTextNodeDescendant
			) === Node.DOCUMENT_POSITION_FOLLOWING)
	) {
		intersector.hintAnchorRect = firstImage.getBoundingClientRect();
	} else {
		// If the element has text, we situate the hint next to the first character
		// in case the text spans multiple lines
		const firstCharacterRect = intersector.firstTextNodeDescendant
			? getFirstCharacterRect(intersector.firstTextNodeDescendant)
			: undefined;
		intersector.hintAnchorIsText = Boolean(firstCharacterRect);
		intersector.hintAnchorRect =
			firstCharacterRect ?? element.getBoundingClientRect();
	}

	const rect = intersector.element.getBoundingClientRect();

	// Top left
	if (
		isNotObscured(
			element,
			getElementFromPoint(
				intersector.hintAnchorRect.x + 5,
				intersector.hintAnchorRect.y + 5
			)
		)
	) {
		intersector.hintPlacement = "top";
		return true;
	}

	// Bottom Left
	if (
		isNotObscured(
			element,
			getElementFromPoint(rect.x + 5, rect.y + rect.height - 5)
		)
	) {
		intersector.hintPlacement = "bottom";
		return true;
	}

	return false;
}
