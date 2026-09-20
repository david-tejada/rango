import { getBoundingClientRect } from "../layoutCache";
import { type UnderlineText } from "./getUnderlineText";

/**
 * Builds the `Range` covering the two characters of `underlineText` that spell
 * `label`.
 *
 * Returns `undefined` when the label can't be underlined after all, for example
 * because its two characters ended up on different lines or because the text
 * turned out not to be painted where the element is. In that case the caller
 * falls back to a regular hint using the same label.
 */
export function getUnderlineRange(
	target: Element,
	underlineText: UnderlineText,
	label: string
): Range | undefined {
	const { text, positions } = underlineText;

	// `getLabelCandidates` keys candidates on their first occurrence, so this is
	// the same index the background script matched.
	const index = text.indexOf(label);
	if (index === -1) return;

	const start = positions[index];
	const end = positions[index + 1];
	if (!start || !end || !start.node.isConnected || !end.node.isConnected) {
		return;
	}

	// The text nodes could have changed since we read them.
	if (
		start.node.length <= start.offset ||
		end.node.length <= end.offset ||
		!normalizes(start.node.data[start.offset]!, label[0]!) ||
		!normalizes(end.node.data[end.offset]!, label[1]!)
	) {
		return;
	}

	const range = document.createRange();
	range.setStart(start.node, start.offset);
	range.setEnd(end.node, end.offset + 1);

	return isUnderlineVisible(range, target) ? range : undefined;
}

/**
 * Cheap check that a character still corresponds to the letter of the label.
 * We don't repeat the full normalization, a case insensitive comparison of the
 * base character is enough to detect that the text changed under us.
 */
function normalizes(character: string, letter: string) {
	return (
		character
			.normalize("NFD")
			.replaceAll(/\p{Diacritic}/gu, "")
			.toLowerCase() === letter
	);
}

function isUnderlineVisible(range: Range, target: Element) {
	const rects = range.getClientRects();

	// More than one rect means the two characters were split across lines, which
	// would render as two separate underlines.
	if (rects.length !== 1) return false;

	const rect = rects[0]!;
	if (rect.width === 0 || rect.height === 0) return false;

	// Make sure the characters are painted where the element is. Text can be
	// pushed out of view with techniques like a large negative `text-indent` or
	// be clipped by an ancestor with `overflow: hidden`.
	const targetRect = getBoundingClientRect(target);
	const x = rect.x + rect.width / 2;
	const y = rect.y + rect.height / 2;

	return (
		x >= targetRect.left &&
		x <= targetRect.right &&
		y >= targetRect.top &&
		y <= targetRect.bottom
	);
}
