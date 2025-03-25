import Color from "colorjs.io";

/**
 * Resolves the background color of an element compositing its background
 * colors together if it has multiple with different alphas.
 *
 * @param element - The element to resolve the background color of.
 * @returns The background color of the element.
 */
export function resolveBackgroundColor(element: Element) {
	const backgroundColors = getBackgroundColors(element);
	return compositeColors(backgroundColors)?.to("srgb").toString();
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

/**
 * Composites a list of colors with different alphas together.
 *
 * @param colors - The list of colors to composite.
 * @returns The composite color or `white` if no colors are provided.
 */
function compositeColors(colors: Color[]) {
	if (colors.length < 2) {
		return colors[0] ?? new Color("white");
	}

	// Start with the bottom color
	let result = colors[0]!;

	// Layer each subsequent color on top
	for (let i = 1; i < colors.length; i++) {
		const foreground = colors[i];
		const alpha = foreground!.alpha;
		const coords = result.to("srgb").coords;
		const fcoords = foreground!.to("srgb").coords;

		// Apply the "over" compositing formula
		const r = fcoords[0] * alpha + coords[0] * (1 - alpha);
		const g = fcoords[1] * alpha + coords[1] * (1 - alpha);
		const b = fcoords[2] * alpha + coords[2] * (1 - alpha);

		result = new Color("srgb", [r, g, b]);
	}

	return result;
}
