import { isVisible } from "../utils/isVisible";

export function getRequiredZIndex(element: HTMLElement): string {
	const elements = element.querySelectorAll(
		"*:not(.rango-hints-container, .rango-hint)"
	);

	// Quick and dirty. I don't check if z-index is actually doing something, that is,
	// if the element that has the property creates a stacking context
	const maxZIndex = Array.from(elements).reduce((acc, curr) => {
		const zIndex = window.getComputedStyle(curr).zIndex;
		const value =
			zIndex === "auto" || !isVisible(curr) ? 0 : Number.parseInt(zIndex, 10);
		return Math.max(acc, value);
	}, 0);

	return `${maxZIndex + 1}`;
}
