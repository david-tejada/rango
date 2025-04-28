import { getCachedStyle } from "../hints/layoutCache";

/**
 * Checks if the element or one of its close ancestors is flipped with scaleY(-1).
 *
 * This technique is sometimes use to reorder elements. First the container is
 * flipped and then each individual element, resulting in the children's order
 * being reversed. This is used, for example, in the Google Search results page.
 */
export function isFlippedWithScaleY(element: Element) {
	const maxAncestorLevel = 3;
	let current: Element | null = element;
	let ancestorLevel = 0;

	while (current && ancestorLevel < maxAncestorLevel) {
		const transform = getCachedStyle(current).transform;

		if (transform && transform === "matrix(1, 0, 0, -1, 0, 0)") {
			return true;
		}

		current = current.parentElement;
		ancestorLevel++;
	}

	return false;
}
