import { getCachedStyle } from "../layoutCache";

/**
 * How far below the text our underline sits when the page doesn't underline it
 * itself.
 */
const defaultOffset = 3;

/**
 * The clear space we leave between the bottom of the page's own underline and
 * the top of ours. Just enough to read as two lines rather than one thick one.
 */
const gap = 2;

/**
 * We never push our underline further than this. Past it, it starts to reach
 * into the next line of text.
 */
const maximumOffset = 10;

/**
 * What `text-underline-offset: auto` resolves to. It can't be read back from
 * the computed style, but measured in Chrome it is one pixel for every font and
 * font size tried.
 */
const autoOffset = 1;

/**
 * Returns how far below the text, in pixels, the underline that spells out the
 * label of a hint should sit.
 *
 * When the page already underlines the text we place ours just below the page's
 * one, so that the label reads as a second short line under exactly its two
 * characters.
 */
export function getUnderlineOffset(node: Text) {
	const pageUnderline = getPageUnderline(node);
	if (!pageUnderline) return defaultOffset;

	const { offset, thickness } = pageUnderline;

	// The thickness of an underline grows downwards from its offset, so the
	// bottom of the page's line is at `offset + thickness`. Both lines are
	// measured from the same zero position, so we can add the gap to that.
	const result = Math.round((offset + thickness + gap) * 10) / 10;

	return Math.min(result, maximumOffset);
}

/**
 * Returns the offset and thickness, in pixels, of the underline the page paints
 * over this text, or `undefined` if it doesn't paint one.
 *
 * Text decorations propagate from the element that declares them down to its
 * inline descendants, so we need to look up the tree. They don't propagate into
 * atomic inlines (inline-block, inline-flex, floats, absolutely positioned
 * elements...), and since all of those compute to a display other than
 * `inline`, that is the only check we need.
 */
function getPageUnderline(node: Text) {
	let current = node.parentElement;

	while (current) {
		const style = getCachedStyle(current);

		if (style.textDecorationLine.includes("underline")) {
			const fontSize = Number.parseFloat(style.fontSize) || 16;

			return {
				offset: toPixels(style.textUnderlineOffset, fontSize, autoOffset),
				thickness: toPixels(
					style.textDecorationThickness,
					fontSize,
					Math.max(1, Math.round(fontSize / 12))
				),
			};
		}

		if (style.display !== "inline") return undefined;

		current = current.parentElement;
	}

	return undefined;
}

/**
 * Resolves a computed `text-underline-offset` or `text-decoration-thickness`
 * to pixels.
 *
 * `auto` and `from-font` depend on the font metrics and can't be read back, so
 * they resolve to `fallback`. Measured in Chrome, an `auto` underline is one
 * pixel thick up to a font size of 16 and grows by a pixel every 12 from there.
 */
function toPixels(value: string, fontSize: number, fallback: number) {
	const number = Number.parseFloat(value);
	if (Number.isNaN(number)) return fallback;

	if (value.endsWith("px")) return number;
	if (value.endsWith("em")) return number * fontSize;
	if (value.endsWith("%")) return (number / 100) * fontSize;

	return fallback;
}
