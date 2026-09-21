/**
 * Utilities to work out which labels can be rendered by underlining two
 * characters of the text of a hinted element.
 *
 * Both the content script (which produces the text) and the background script
 * (which does the matching against the available labels) need to agree on what
 * counts as a candidate, so the logic lives here.
 *
 * The text these functions receive must be *normalized*: a string made up
 * exclusively of the characters `a-z` and spaces, where every character maps
 * one to one to a character rendered on the page. Any character that is not a
 * plain latin letter (punctuation, digits, symbols, whitespace) is replaced by
 * a space. See `getUnderlineText` in the content script.
 */

type LabelCandidate = {
	/** The two letter label, for example `"ho"`. */
	label: string;
	/** Index within the normalized text of the first of the two characters. */
	index: number;
};

/**
 * Returns the labels that could be used to underline `text`, in order of
 * preference. Only pairs of contiguous latin letters qualify, so no pair spans
 * a space, a symbol or any other character.
 *
 * Pairs within the first `preferredLength` characters come first, then pairs at
 * the start of a word since they are easier to spot, and within each group
 * earlier pairs come first. Repeated pairs are only returned once, for their
 * first occurrence.
 *
 * @param preferredLength - The length of the leading part of `text` a label
 * should come from if it can. See `UnderlineText`.
 */
export function getLabelCandidates(
	text: string,
	preferredLength = text.length
): LabelCandidate[] {
	const candidates: LabelCandidate[] = [];
	const seen = new Set<string>();

	for (let index = 0; index < text.length - 1; index++) {
		const label = text.slice(index, index + 2);
		if (!isLetter(text[index]) || !isLetter(text[index + 1])) continue;
		if (seen.has(label)) continue;

		seen.add(label);
		candidates.push({ label, index });
	}

	// A pair that starts inside the preferred part but runs past its end isn't
	// in it, since only its first character would be where we want the label.
	const isPreferred = ({ index }: LabelCandidate) =>
		index + 2 <= preferredLength;

	return candidates.sort(
		(a, b) =>
			Number(isPreferred(b)) - Number(isPreferred(a)) ||
			Number(isWordStart(text, b.index)) - Number(isWordStart(text, a.index)) ||
			a.index - b.index
	);
}

function isLetter(character: string | undefined) {
	return character !== undefined && character >= "a" && character <= "z";
}

function isWordStart(text: string, index: number) {
	return index === 0 || !isLetter(text[index - 1]);
}
