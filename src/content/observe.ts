import { getToggles } from "./settings/toggles";
import {
	addWrappersFrom,
	mutationObserver,
	disconnectObservers,
} from "./wrappers/ElementWrapperClass";
import { clearWrappersAll } from "./wrappers/wrappers";

let enabled = false;
const config = { attributes: true, childList: true, subtree: true };

export async function updateHintsEnabled() {
	const newEnabled = getToggles().computed;

	if (!enabled && newEnabled) {
		await observe();
		enabled = true;
	}

	if (enabled && !newEnabled) {
		disconnectObservers();
		clearWrappersAll();
		enabled = false;
	}
}

export default async function observe() {
	enabled = getToggles().computed;
	if (enabled) {
		// We observe all the initial elements before any mutation
		if (document.body) addWrappersFrom(document.body);

		// We observe document instead of document.body in case the body gets replaced
		mutationObserver.observe(document, config);
	}
}
