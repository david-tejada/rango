/**
 * Utilities to work out which labels can be rendered by underlining the text of
 * a hinted element.
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
	/** The label, for example `"ho"`. */
	label: string;
	/** Index within the normalized text of its first character. */
	index: number;
};

/**
 * A piece of text this short can't spell many pairs: "ux" spells exactly one,
 * so a second element reading the same has nothing left. Underlining a single
 * character gives them somewhere else to go.
 */
const maxLettersForSingleCharacter = 3;

/**
 * Letters whose underline is barely a tick. Fine as a last resort, but another
 * letter of the same word is easier to see.
 */
const narrowLetters = new Set(["i", "j", "l", "f", "t", "r"]);

/**
 * Returns the labels that could be used to underline `text`, in order of
 * preference. Only runs of contiguous latin letters qualify, so no label spans
 * a space, a symbol or any other character.
 *
 * Pairs come before single characters, since two underlined characters are
 * easier to see than one, and single characters are only offered at all when
 * the text is too short to spell many pairs. Whether a single character label
 * can be used is not decided here: it depends on the stack holding any, which
 * the `includeSingleLetterHints` setting governs.
 *
 * Within each of those, labels in the first `preferredLength` characters come
 * first, then those at the start of a word since they are easier to spot, then
 * the wider letters, then the earlier ones. Repeated labels are only returned
 * once, for their first occurrence.
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

	const add = (index: number, length: number) => {
		const label = text.slice(index, index + length);
		if (seen.has(label)) return;

		seen.add(label);
		candidates.push({ label, index });
	};

	for (let index = 0; index < text.length - 1; index++) {
		if (isLetter(text[index]) && isLetter(text[index + 1])) add(index, 2);
	}

	if (countLetters(text) <= maxLettersForSingleCharacter) {
		for (const [index, character] of [...text].entries()) {
			if (isLetter(character)) add(index, 1);
		}
	}

	// A label that starts inside the preferred part but runs past its end isn't
	// in it, since only its first character would be where we want it.
	const isPreferred = ({ label, index }: LabelCandidate) =>
		index + label.length <= preferredLength;

	const isNarrow = ({ label }: LabelCandidate) =>
		label.length === 1 && narrowLetters.has(label);

	return candidates.sort(
		(a, b) =>
			Number(isPreferred(b)) - Number(isPreferred(a)) ||
			b.label.length - a.label.length ||
			Number(isWordStart(text, b.index)) - Number(isWordStart(text, a.index)) ||
			Number(isNarrow(a)) - Number(isNarrow(b)) ||
			a.index - b.index
	);
}

function countLetters(text: string) {
	let count = 0;
	for (const character of text) if (isLetter(character)) count++;
	return count;
}

function isLetter(character: string | undefined) {
	return character !== undefined && character >= "a" && character <= "z";
}

function isWordStart(text: string, index: number) {
	return index === 0 || !isLetter(text[index - 1]);
}
