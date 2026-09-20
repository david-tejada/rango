/**
 * Renders the labels of underline hints using the CSS Custom Highlight API.
 *
 * Instead of appending an element to the page we register a `Highlight` holding
 * one `Range` per hint, each one covering the two characters of the text of the
 * hinted element that make up its label. This means no extra elements, no
 * positioning and no layout distortion.
 *
 * A highlight can only be styled through its `::highlight()` rule, so anything
 * that varies per hint needs a highlight of its own. What varies is how far
 * below the text the line sits and what color it is, both of which follow the
 * page's own underline when there is one, so highlights are keyed by those.
 */

import { type UnderlineStyle } from "./getUnderlineStyle";

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
const styled = new Set<string>();
let styleSheet: CSSStyleSheet | undefined;

/**
 * A highlight name has to be a valid CSS identifier, and both the offset, which
 * can be fractional, and the color, which is a `rgb(...)` string, are not.
 */
function toIdent(value: string) {
	return value.replaceAll(/[^a-z\d]+/gi, "_");
}

function highlightName(style: UnderlineStyle, state: UnderlineState) {
	return `rango-underline-${toIdent(`${style.offset}-${style.color}`)}-${state}`;
}

/**
 * The name of the highlight that redraws the page's own underline over the two
 * characters our highlight would otherwise blank out.
 */
function replicaName(page: UnderlineStyle["pageUnderline"]) {
	if (!page) return undefined;

	return `rango-underline-page-${toIdent(
		`${page.offset}-${page.thickness}-${page.color}-${page.skipInk}`
	)}`;
}

function highlightRule(style: UnderlineStyle, state: UnderlineState) {
	const background =
		state === "flash"
			? `background-color: ${emphasisColor}; color: ${flashColor};`
			: "";

	// The emphasis and flash colors are a deliberate signal, so they don't follow
	// the page.
	const color = state === "default" ? style.color : emphasisColor;

	return `::highlight(${highlightName(style, state)}) {
		${background}
		text-decoration: underline;
		text-decoration-skip-ink: none;
		text-decoration-thickness: ${thickness[state]};
		text-decoration-color: ${color};
		text-underline-offset: ${style.offset}px;
	}`;
}

function replicaRule(
	name: string,
	page: NonNullable<UnderlineStyle["pageUnderline"]>
) {
	return `::highlight(${name}) {
		text-decoration: underline;
		text-decoration-skip-ink: ${page.skipInk};
		text-decoration-thickness: ${page.thickness}px;
		text-decoration-color: ${page.color};
		text-underline-offset: ${page.offset}px;
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
function ensureInitialized(style: UnderlineStyle) {
	if (!supportsUnderlineHints()) return;

	// We use a constructed stylesheet rather than a `<style>` element because it
	// isn't part of the dom, so pages can't remove it and it isn't subject to
	// their content security policy.
	styleSheet ??= new CSSStyleSheet();

	if (!document.adoptedStyleSheets.includes(styleSheet)) {
		document.adoptedStyleSheets = [...document.adoptedStyleSheets, styleSheet];
	}

	const names = states.map((state) => highlightName(style, state));
	const replica = replicaName(style.pageUnderline);

	for (const [index, name] of names.entries()) {
		if (!styled.has(name)) {
			styled.add(name);
			styleSheet.insertRule(highlightRule(style, states[index]!));
		}
	}

	if (replica && !styled.has(replica)) {
		styled.add(replica);
		styleSheet.insertRule(replicaRule(replica, style.pageUnderline!));
	}

	for (const name of replica ? [...names, replica] : names) {
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
 * @param style - How the line should be drawn. See `getUnderlineStyle`.
 */
export function showUnderline(
	range: Range,
	style: UnderlineStyle,
	state: UnderlineState = "default"
) {
	ensureInitialized(style);
	hideUnderline(range);

	// The page's own line goes back first, then ours on top of it.
	const replica = replicaName(style.pageUnderline);
	if (replica) highlights.get(replica)?.add(range);

	highlights.get(highlightName(style, state))?.add(range);
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
