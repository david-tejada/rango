import { resetStagedSelectors } from "../hints/customSelectorsStaging";
import { extraSelector, getExcludeSelectorAll } from "../hints/selectors";
import { refresh } from "./refresh";

let showExtraHints = false;
let showExcludedHints = false;

export async function refreshHints() {
	await resetStagedSelectors();
	showExtraHints = false;
	showExcludedHints = false;
	await refresh({ hintsColors: true, hintsCharacters: true, isHintable: true });
}

export function getExtraHintsToggle() {
	return showExtraHints;
}

export function getShowExcludedToggle() {
	return showExcludedHints;
}

export async function displayMoreOrLessHints(options: {
	extra?: boolean;
	excluded?: boolean;
}) {
	if (options.extra !== undefined) showExtraHints = options.extra;
	if (options.excluded !== undefined) showExcludedHints = options.excluded;

	// We need to update the excluded hints as this function serves to also show
	// previously excluded hints
	const excludeSelector = getExcludeSelectorAll();
	let selector = extraSelector;
	if (excludeSelector) selector = `${selector}, ${excludeSelector}`;

	await refresh({ hintsColors: true, isHintable: true, filterIn: [selector] });
}
