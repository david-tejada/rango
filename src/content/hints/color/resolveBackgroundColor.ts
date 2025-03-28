import Color from "colorjs.io";
import { compositeColors } from "./compositeColors";

/**
 * Resolves the background color of an element compositing its background
 * colors together if it has multiple with different alphas.
 *
 * @param element - The element to resolve the background color of.
 * @returns The background color of the element.
 */
export function resolveBackgroundColor(element: Element) {
	const backgroundColors = getBackgroundColors(element);
	return compositeColors(backgroundColors);
}

/**
 * Gets the background colors of an element and its ancestors until a fully
 * opaque color is found.
 *
 * @param element - The element to get the background colors of.
 * @returns The background colors of the element.
 */
function getBackgroundColors(element: Element): Color[] {
	let current: Element | null = element;
	const colors: Color[] = [];

	while (current) {
		const backgroundColor = new Color(
			getComputedStyle(current).backgroundColor
		);

		if (backgroundColor.alpha.valueOf() !== 0) {
			colors.push(backgroundColor);
		}

		if (backgroundColor.alpha.valueOf() === 1) {
			break;
		}

		current = current.parentElement;
	}

	return colors.reverse();
}
