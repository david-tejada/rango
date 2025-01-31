import { onDocumentVisible } from "./dom/whenVisible";
import { settingsSync } from "./settings/settingsSync";
import { getToggles } from "./settings/toggles";
import {
	addWrappersFrom,
	disconnectObservers,
	mutationObserver,
} from "./wrappers/ElementWrapper";
import {
	clearWrappersAll,
	hideHintsAll,
	showHintsAll,
} from "./wrappers/wrappers";

let enabled = false;
const config = { attributes: true, childList: true, subtree: true };

export async function updateHintsEnabled() {
	const newEnabled = getToggles().computed;
	const alwaysComputeHintables = settingsSync.get("alwaysComputeHintables");

	// Here we assume that just one change of state takes place. That is, in the
	// same call to this function, either the hints have been switched or the
	// setting alwaysComputeHintables has changed. Not both at the same time. This
	// function is also called when the content script first runs.

	// 1. disabled -> enabled
	if (!enabled && newEnabled) {
		if (alwaysComputeHintables) {
			showHintsAll();
		} else {
			await observe();
		}

		// 2. enabled -> disabled
	} else if (enabled && !newEnabled) {
		if (alwaysComputeHintables) {
			hideHintsAll();
		} else {
			disconnectObservers();
			clearWrappersAll();
		}

		// 3. !alwaysComputeHintables -> alwaysComputeHintables
	} else if (!enabled && alwaysComputeHintables) {
		await observe();

		// 4. alwaysComputeHintables -> !alwaysComputeHintables
	} else if (!enabled && !alwaysComputeHintables) {
		disconnectObservers();
		clearWrappersAll();
	}

	enabled = newEnabled;
}

export default async function observe() {
	enabled = getToggles().computed;
	if (enabled || settingsSync.get("alwaysComputeHintables")) {
		// We observe all the initial elements before any mutation
		if (document.body) addWrappersFrom(document.body);

		// We observe document instead of document.body in case the body gets replaced
		mutationObserver.observe(document, config);
	}
}

settingsSync.onChange(
	[
		"hintsToggleGlobal",
		"hintsToggleHosts",
		"hintsTogglePaths",
		"hintsToggleTabs",
		"alwaysComputeHintables",
	],
	() => {
		onDocumentVisible(updateHintsEnabled);
	}
);
