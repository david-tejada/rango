const thresholdExcellent = 0.1;
const thresholdStrong = 0.2;
const thresholdGood = 0.3;
const thresholdWeak = 0.4;

export type FuzzyMatch = {
	match: { score: number; isHintable: boolean };
};

/**
 * Returns the best fuzzy match from an array of matches having into account
 * the score and if it's hintable or not.
 *
 * @param matches - The array of matches to search through.
 * @returns The best match.
 */
export function getBestFuzzyMatch<T extends FuzzyMatch>(
	matches: T[]
): T | undefined {
	if (matches.length === 0) return undefined;

	const hintableMatches = matches.filter(({ match }) => match.isHintable);
	const nonHintableMatches = matches.filter(({ match }) => !match.isHintable);

	// First, look for strong hintable matches
	const strongHintables = hintableMatches.filter(
		({ match }) => match.score < thresholdStrong
	);

	if (strongHintables.length > 0) return getMatchWithBestScore(strongHintables);

	// If no strong hintable match, check for excellent non-hintable matches
	// but only if there are no good hintable matches
	if (nonHintableMatches.length > 0) {
		const excellentNonHintables = nonHintableMatches.filter(
			({ match }) => match.score < thresholdExcellent
		);
		const goodHintables = hintableMatches.filter(
			({ match }) => match.score <= thresholdGood
		);

		if (excellentNonHintables.length > 0 && goodHintables.length === 0) {
			return getMatchWithBestScore(excellentNonHintables);
		}
	}

	// If still no match, look for weak hintable matches
	if (hintableMatches.length > 0) {
		const weakHintables = hintableMatches.filter(
			({ match }) => match.score < thresholdWeak
		);
		if (weakHintables.length > 0) {
			return getMatchWithBestScore(weakHintables);
		}
	}

	// Finally, if still no match, take the best score from either category
	return getMatchWithBestScore(matches);
}

function getMatchWithBestScore<T extends FuzzyMatch>(matches: T[]): T {
	let bestMatch = matches[0];
	if (!bestMatch) throw new Error("'matches' array is empty");

	for (const match of matches) {
		if (match.match.score < bestMatch.match.score) {
			bestMatch = match;
		}
	}

	return bestMatch;
}
