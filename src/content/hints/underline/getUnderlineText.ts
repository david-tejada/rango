import { getWrapperForElement } from "../../wrappers/wrappers";

/**
 * A position within the DOM text of an element, equivalent to a
 * `Range` boundary point.
 */
type TextPosition = {
	node: Text;
	offset: number;
};

const headingSelector = "h1, h2, h3, h4, h5, h6, [role='heading']";

export type UnderlineText = {
	/**
	 * The visible text of the element, normalized so that it only contains the
	 * characters `a-z` and spaces, with every character mapping one to one to a
	 * character in the DOM.
	 */
	text: string;

	/**
	 * The DOM position of each character of `text`. It is `undefined` for the
	 * separators we insert between text nodes, which don't exist in the DOM.
	 */
	positions: Array<TextPosition | undefined>;

	/**
	 * The length of the leading part of `text` that a label should come from if
	 * it can. When the element has a heading inside it, as a search result does,
	 * that is the heading: it is what the eye goes to, so a label sitting in the
	 * summary underneath is harder to find. It is the whole length when there is
	 * nothing to prefer.
	 */
	preferredLength: number;
};

/**
 * We only look at the beginning of the text of an element. Elements with a lot
 * of text are rare and scanning all of it would be wasteful. Two characters
 * anywhere past this point would be hard to spot anyway.
 */
const maxTextLength = 150;

/**
 * The maximum number of text nodes we examine per element. Checking whether a
 * text node is rendered forces layout, so we need to keep this bounded.
 */
const maxTextNodes = 10;

const skipTextNodesWithin = ".rango-hint, script, style, noscript, select";

/**
 * Returns the visible text of an element in a form that can be matched against
 * the available labels, together with the DOM position of each character so
 * that we can underline the characters that end up being the label.
 *
 * Returns `undefined` if the element has no visible text with at least two
 * contiguous latin letters, in which case it needs a regular hint.
 */
export function getUnderlineText(element: Element): UnderlineText | undefined {
	const collected: Collected = { text: "", positions: [], nodesSeen: 0 };
	const taken = new Set<Text>();

	// The heading first, so that its characters are the ones a label is matched
	// against before anything else in the element.
	const heading = element.querySelector(headingSelector);
	if (heading) collect(heading, element, collected, taken);

	const headingLength = collected.text.length;

	collect(element, element, collected, taken);

	const { text, positions } = collected;

	// With no heading there is nothing to prefer, which is the same as preferring
	// all of it.
	const preferredLength = heading ? headingLength : text.length;

	return /[a-z]{2}/.test(text)
		? { text, positions, preferredLength }
		: undefined;
}

type Collected = {
	text: string;
	positions: Array<TextPosition | undefined>;
	nodesSeen: number;
};

/**
 * Appends the visible text of `root` to `collected`, skipping any text node
 * already taken by an earlier call.
 */
function collect(
	root: Element,
	hintable: Element,
	collected: Collected,
	taken: Set<Text>
) {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

	while (
		collected.text.length < maxTextLength &&
		collected.nodesSeen < maxTextNodes
	) {
		const node = walker.nextNode() as Text | null;
		if (!node) break;

		if (taken.has(node)) continue;
		if (!node.textContent || !/\S/.test(node.textContent)) continue;

		collected.nodesSeen++;
		if (!isRendered(node, hintable)) continue;

		taken.add(node);

		// Text nodes that are not contiguous in the DOM might still render next to
		// each other, but we can't know that cheaply. We separate them so that we
		// never produce a label whose two characters aren't visibly together.
		if (collected.text.length > 0) {
			collected.text += " ";
			collected.positions.push(undefined);
		}

		// We iterate by code unit and not by code point because that is what
		// `Range` offsets are measured in. Any code unit that isn't a latin letter
		// (including each half of a surrogate pair) becomes a space.
		let offset = 0;
		while (offset < node.length) {
			collected.text += normalizeCharacter(node.data.charAt(offset));
			collected.positions.push({ node, offset });
			offset++;
		}
	}
}

/**
 * Maps a character of the DOM text to the character that would be typed to
 * select it. Anything that isn't a plain latin letter becomes a space, which
 * acts as a separator when looking for candidate labels.
 *
 * Note that this must not change the length of the string: the index of every
 * character needs to keep matching its offset within the text node.
 */
function normalizeCharacter(character: string) {
	const normalized = character
		.normalize("NFD")
		.replaceAll(/\p{Diacritic}/gu, "")
		.toLowerCase();

	return normalized.length === 1 && normalized >= "a" && normalized <= "z"
		? normalized
		: " ";
}

/**
 * Returns `true` if the text node is actually painted and belongs to the
 * element we are hinting and not to a nested hintable.
 */
function isRendered(node: Text, hintable: Element) {
	const { parentElement } = node;
	if (!parentElement || parentElement.closest(skipTextNodesWithin)) {
		return false;
	}

	// The text of a nested hintable belongs to that hintable, not to this one.
	let current: Element | null = parentElement;
	while (current && current !== hintable) {
		if (getWrapperForElement(current)?.isHintable) return false;
		current = current.parentElement;
	}

	const { visibility, opacity, width, height, textIndent } =
		getComputedStyle(parentElement);
	if (visibility === "hidden" || opacity === "0") return false;

	// A large negative text indent is another way of hiding text while leaving
	// it in the layout. Same threshold as in `getElementToPositionHint`.
	if (Math.abs(Number.parseInt(textIndent, 10)) > 100) return false;

	// This catches text hidden with the .sr-only/.visually-hidden technique. The
	// rect of the text itself doesn't help here: `clip` and `overflow` only
	// affect painting, so the text keeps its full natural layout box and looks
	// perfectly visible. What gives it away is the size of its container. Same
	// check as in `getElementToPositionHint`.
	if (Number.parseFloat(width) < 3 && Number.parseFloat(height) < 3) {
		return false;
	}

	// The computed size above is the specified one, so it says nothing about a
	// `display: none` subtree within the hintable. The rect of the text does: it
	// only has one when the text is laid out.
	const range = document.createRange();
	range.selectNodeContents(node);
	const rect = range.getBoundingClientRect();

	return rect.width > 0 && rect.height > 0;
}
