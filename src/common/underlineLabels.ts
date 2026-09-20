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
 * Pairs at the start of a word come first since they are easier to spot, and
 * within each group earlier pairs come first. Repeated pairs are only returned
 * once, for their first occurrence.
 */
export function getLabelCandidates(text: string): LabelCandidate[] {
	const candidates: LabelCandidate[] = [];
	const seen = new Set<string>();

	for (let index = 0; index < text.length - 1; index++) {
		const label = text.slice(index, index + 2);
		if (!isLetter(text[index]) || !isLetter(text[index + 1])) continue;
		if (seen.has(label)) continue;

		seen.add(label);
		candidates.push({ label, index });
	}

	return candidates.sort(
		(a, b) =>
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
