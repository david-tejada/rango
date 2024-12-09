import { sendMessage } from "../../messaging/contentMessageBroker";
import { type ElementWrapper } from "../../wrappers/ElementWrapper";
import { refresh } from "../../wrappers/refresh";
import {
	extraSelector,
	getExcludeSelectorAll,
	updateCustomSelectors,
} from "../selectors";
import {
	pickSelectorAlternative,
	resetStagedSelectors,
	saveCustomSelectors,
	stageCustomSelectors,
	stageExcludeUniversalSelector,
} from "./customSelectorsStaging";

let showExtraHints = false;
let showExcludedHints = false;

export function getExtraHintsToggle() {
	return showExtraHints;
}

export function getShowExcludedToggle() {
	return showExcludedHints;
}

export function resetExtraHintsToggles() {
	showExtraHints = false;
	showExcludedHints = false;
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

export async function markHintsForInclusion(wrappers: ElementWrapper[]) {
	const selectorsToRefresh = await stageCustomSelectors(wrappers, "include");
	await refresh({
		hintsColors: true,
		isHintable: true,
		filterIn: selectorsToRefresh,
	});
}

export async function markHintsForExclusion(wrappers: ElementWrapper[]) {
	const selectorsToRefresh = await stageCustomSelectors(wrappers, "exclude");
	await refresh({
		hintsColors: true,
		isHintable: true,
		filterIn: selectorsToRefresh,
	});
}

export async function markAllHintsForExclusion() {
	stageExcludeUniversalSelector();
	await refresh({
		hintsColors: true,
	});
}

export async function markHintsWithBroaderSelector() {
	const selectorsToRefresh = pickSelectorAlternative({ step: 1 });

	if (selectorsToRefresh) {
		await refresh({
			hintsColors: true,
			isHintable: true,
			filterIn: selectorsToRefresh,
		});
	}
}

export async function markHintsWithNarrowerSelector() {
	const selectorsToRefresh = pickSelectorAlternative({ step: -1 });

	if (selectorsToRefresh) {
		await refresh({
			hintsColors: true,
			isHintable: true,
			filterIn: selectorsToRefresh,
		});
	}
}

export async function customHintsConfirm() {
	const selectorsAdded = await saveCustomSelectors();

	if (selectorsAdded.length > 0) {
		await refresh({
			hintsStyle: true,
			isHintable: true,
			filterIn: selectorsAdded.map(({ selector }) => selector),
		});
	}

	await displayMoreOrLessHints({ extra: false, excluded: false });
}

/**
 * Resets the custom selectors for the URL pattern of the current frame. To
 * avoid multiple frames changing the custom selectors at the same time a
 * message is sent to the background script where that is handled safely.
 */
export async function customHintsReset() {
	showExtraHints = false;
	showExcludedHints = false;

	await sendMessage("resetCustomSelectors", {
		url: globalThis.location.href,
	});

	await updateCustomSelectors();
	await resetStagedSelectors();

	await refresh();
}
