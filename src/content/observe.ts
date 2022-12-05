import { shouldDisplayHints } from "./hints/shouldDisplayHints";
import { addWrappersFrom, mutationObserver } from "./Wrapper";
import { clearWrappersAll } from "./wrappers";

let enabled = false;
const config = { attributes: true, childList: true, subtree: true };

export async function updateHintsEnabled() {
	const newEnabled = await shouldDisplayHints();

	if (!enabled && newEnabled) {
		await observe();
		enabled = true;
	}

	if (enabled && !newEnabled) {
		clearWrappersAll();
		enabled = false;
	}
}

export default async function observe() {
	enabled = await shouldDisplayHints();

	if (enabled) {
		// We observe all the initial elements before any mutation
		addWrappersFrom(document.body);

		// We observe document instead of document.body in case the body gets replaced
		mutationObserver.observe(document, config);
	}
}
