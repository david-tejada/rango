import { type UnderlineText } from "./getUnderlineText";

/**
 * Builds the `Range` covering the characters of `underlineText` that spell
 * `label`.
 *
 * Returns `undefined` when the label can't be underlined after all, for example
 * because its characters ended up on different lines or because the text
 * turned out not to be painted where the element is. In that case the caller
 * falls back to a regular hint using the same label.
 */
export function getUnderlineRange(
	underlineText: UnderlineText,
	label: string
): Range | undefined {
	const { text, positions } = underlineText;

	// `getLabelCandidates` keys candidates on their first occurrence, so this is
	// the same index the background script matched.
	const index = text.indexOf(label);
	if (index === -1) return;

	const start = positions[index];
	const end = positions[index + label.length - 1];
	if (!start || !end || !start.node.isConnected || !end.node.isConnected) {
		return;
	}

	// The text nodes could have changed since we read them.
	for (const [offset, letter] of [...label].entries()) {
		const position = positions[index + offset];
		if (
			!position ||
			position.node.length <= position.offset ||
			!normalizes(position.node.data[position.offset]!, letter)
		) {
			return;
		}
	}

	const range = document.createRange();
	range.setStart(start.node, start.offset);
	range.setEnd(end.node, end.offset + 1);

	return isUnderlineVisible(range) ? range : undefined;
}

/**
 * Returns `true` if `text` still spells `label`. Cheap enough to call on every
 * mutation, since it only looks at a character or two and reads no layout.
 */
export function spellsLabel(text: string, label: string) {
	return (
		text.length === label.length &&
		[...text].every((character, index) => normalizes(character, label[index]!))
	);
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

function isUnderlineVisible(range: Range) {
	const rects = [...range.getClientRects()].filter(
		(rect) => rect.width > 0 && rect.height > 0
	);

	const [first] = rects;
	if (!first) return false;

	// What we need to know is that the characters are on the same line,
	// since underlining a pair split across lines would draw two separate marks.
	// We can't just count the rects: the browser reports the same rect more than
	// once often enough, and rejecting those would cost us a lot of underlines.
	return rects.every(
		(rect) =>
			Math.abs(rect.top - first.top) < 1 &&
			Math.abs(rect.bottom - first.bottom) < 1
	);
}
