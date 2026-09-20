import { getCachedStyle } from "../layoutCache";

/**
 * How the line that spells out the label of a hint should be drawn.
 */
export type UnderlineStyle = {
	/** How far below the text the line sits, in pixels. */
	offset: number;
	/** A CSS color, or `currentColor` to follow the text. */
	color: string;
	/**
	 * The underline the page paints over this text, when it paints one.
	 *
	 * A highlight that sets `text-decoration` suppresses the underline of the
	 * element underneath for exactly the characters it covers, which would leave
	 * a two character gap in the page's own line. We redraw it in a highlight of
	 * its own so that it stays unbroken.
	 */
	pageUnderline?: PageUnderline;
};

type PageUnderline = {
	offset: number;
	thickness: number;
	color: string;
	skipInk: string;
};

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
 * Returns how to draw the underline that spells out the label of a hint.
 *
 * When the page already underlines the text we place ours just below the page's
 * one and in the same color, so that the label reads as a second short line
 * under exactly its two characters rather than as something unrelated. Pages
 * that give their links a `text-decoration-color` of their own are common
 * enough that following the text color instead looks out of place.
 */
export function getUnderlineStyle(node: Text): UnderlineStyle {
	const pageUnderline = getPageUnderline(node);
	if (!pageUnderline) return { offset: defaultOffset, color: "currentColor" };

	const { offset, thickness, color } = pageUnderline;

	// The thickness of an underline grows downwards from its offset, so the
	// bottom of the page's line is at `offset + thickness`. Both lines are
	// measured from the same zero position, so we can add the gap to that.
	const result = Math.round((offset + thickness + gap) * 10) / 10;

	return { offset: Math.min(result, maximumOffset), color, pageUnderline };
}

/**
 * Returns the offset and thickness, in pixels, and the color of the underline
 * the page paints over this text, or `undefined` if it doesn't paint one.
 *
 * Text decorations propagate from the element that declares them down to its
 * inline descendants, so we need to look up the tree. They don't propagate into
 * atomic inlines (inline-block, inline-flex, floats, absolutely positioned
 * elements...), and since all of those compute to a display other than
 * `inline`, that is the only check we need.
 */
function getPageUnderline(node: Text): PageUnderline | undefined {
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
				color: style.textDecorationColor,
				// Copied so that the redrawn segment skips descenders exactly the way
				// the page's own line does.
				skipInk: style.textDecorationSkipInk,
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
