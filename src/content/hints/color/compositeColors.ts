import Color from "colorjs.io";
import { white } from "./colors";

/**
 * Composites a list of colors with different alphas together.
 *
 * @param colors - The list of colors to composite.
 * @returns The composite color or `white` if no colors are provided.
 */
export function compositeColors(colors: Color[]) {
	const filtered = colors.filter((color) => color.alpha.valueOf() !== 0);

	if (filtered.length < 2) return filtered[0] ?? white;

	// Start with the bottom color
	let result = filtered[0]!;

	// Layer each subsequent color on top
	for (let i = 1; i < filtered.length; i++) {
		const foreground = filtered[i];
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
