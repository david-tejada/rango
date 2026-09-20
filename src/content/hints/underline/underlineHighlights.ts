/**
 * Renders the labels of underline hints using the CSS Custom Highlight API.
 *
 * Instead of appending an element to the page we register a `Highlight` holding
 * one `Range` per hint, each one covering the two characters of the text of the
 * hinted element that make up its label. This means no extra elements, no
 * positioning and no layout distortion.
 *
 * A highlight can only be styled through its `::highlight()` rule, so anything
 * that varies per hint needs a highlight of its own. The only thing that varies
 * is how far below the text the underline sits, which depends on whether the
 * page already underlines that text, so highlights are keyed by that offset.
 */

type UnderlineState = "default" | "emphasis" | "flash";

const emphasisColor = "#0891b2";
const flashColor = "#fff";

/**
 * `auto` matches the weight the browser would use for a regular underline,
 * which is what makes the label read as a second line of the same text.
 * Emphasis, used while keyboard clicking, is the one case where we thicken it.
 */
const thickness = { default: "auto", emphasis: "2px", flash: "auto" } as const;

const states = ["default", "emphasis", "flash"] as const;

const highlights = new Map<string, Highlight>();
const styledOffsets = new Set<number>();
let styleSheet: CSSStyleSheet | undefined;

/**
 * A highlight name has to be a valid CSS identifier, and an offset computed
 * from the page's own underline can be fractional.
 */
function highlightName(offset: number, state: UnderlineState) {
	return `rango-underline-${String(offset).replace(".", "_")}-${state}`;
}

function highlightRule(offset: number, state: UnderlineState) {
	const background =
		state === "flash"
			? `background-color: ${emphasisColor}; color: ${flashColor};`
			: "";
	const color = state === "default" ? "currentColor" : emphasisColor;

	return `::highlight(${highlightName(offset, state)}) {
		${background}
		text-decoration: underline;
		text-decoration-skip-ink: none;
		text-decoration-thickness: ${thickness[state]};
		text-decoration-color: ${color};
		text-underline-offset: ${offset}px;
	}`;
}

/**
 * Returns `true` if the browser supports the CSS Custom Highlight API. Without
 * it every hint falls back to a regular hint element.
 */
export function supportsUnderlineHints() {
	return typeof CSS !== "undefined" && "highlights" in CSS;
}

/**
 * Registers the highlights and styles for an offset, and puts back anything the
 * page might have taken away since the last time.
 *
 * We can't do this just once: single page apps that swap the contents of
 * `<head>` when navigating, or that reset `adoptedStyleSheets`, would leave the
 * ranges registered but unpainted. Since this runs before showing every
 * underline it needs to stay cheap, which it is once everything is in place.
 */
function ensureInitialized(offset: number) {
	if (!supportsUnderlineHints()) return;

	// We use a constructed stylesheet rather than a `<style>` element because it
	// isn't part of the dom, so pages can't remove it and it isn't subject to
	// their content security policy.
	styleSheet ??= new CSSStyleSheet();

	if (!document.adoptedStyleSheets.includes(styleSheet)) {
		document.adoptedStyleSheets = [...document.adoptedStyleSheets, styleSheet];
	}

	if (!styledOffsets.has(offset)) {
		styledOffsets.add(offset);
		for (const state of states) {
			styleSheet.insertRule(highlightRule(offset, state));
		}
	}

	for (const state of states) {
		const name = highlightName(offset, state);
		let highlight = highlights.get(name);

		if (!highlight) {
			highlight = new Highlight();
			highlights.set(name, highlight);
		}

		if (CSS.highlights.get(name) !== highlight) {
			CSS.highlights.set(name, highlight);
		}
	}
}

/**
 * Displays the underline for a range, removing it from any other highlight it
 * might currently be displayed in.
 *
 * @param offset - How far below the text the underline sits, in pixels. See
 * `getUnderlineOffset`.
 */
export function showUnderline(
	range: Range,
	offset: number,
	state: UnderlineState = "default"
) {
	ensureInitialized(offset);
	hideUnderline(range);
	highlights.get(highlightName(offset, state))?.add(range);
}

export function hideUnderline(range: Range) {
	for (const highlight of highlights.values()) {
		highlight.delete(range);
	}
}

export function clearUnderlines() {
	for (const highlight of highlights.values()) {
		highlight.clear();
	}
}
