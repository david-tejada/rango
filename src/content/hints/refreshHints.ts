import { rehintPending } from "../wrappers/rehint";
import { refresh } from "../wrappers/refresh";
import { getHintedWrappers } from "../wrappers/wrappers";
import { resetExtraHintsToggles } from "./customHints/customHints";
import { resetStagedSelectors } from "./customHints/customSelectorsStaging";
import { cacheLabels, clearLabelsCache } from "./labels/labelCache";
import { clearUnderlines } from "./underline/underlineHighlights";

export async function refreshHints() {
	resetStagedSelectors();
	resetExtraHintsToggles();

	await refresh({ hintsStyle: true, isHintable: true });
	await refreshLabels();
}

/**
 * Clear the labels cache and refresh the labels for all hinted wrappers.
 *
 * Note: There are potential race conditions in this refresh process.
 *
 * The code related to intersection callbacks is considered safe since
 * `claimLabels` would claim or release labels from the stack and that is protected
 * by the mutexes. It will wait until the mutexes are released and the stack has
 * been reset.
 *
 * Other potentially problematic circumstances include:
 * - Reattaching hints deleted by the page
 * - `Wrapper.resizeObserver` being called, resulting in pushing or popping labels
 *
 * These edge cases are acceptable for now since this function only runs in
 * specific user-initiated scenarios and the consequences are not catastrophic:
 * - Manual hint refresh
 * - Changes to settings:
 *   - keyboardClicking
 *   - includeSingleLetterHints
 *   - useNumberHints
 *   - hintsToExclude
 *   - keysToExclude
 */
async function refreshLabels() {
	const wrappersToRefresh = getHintedWrappers();
	for (const wrapper of wrappersToRefresh) wrapper.hint?.release();

	// Safety net in case a hint was released without its underline being removed,
	// for example if its target was taken out of the dom.
	clearUnderlines();

	await clearLabelsCache();

	const elementsNecessary = wrappersToRefresh
		.filter((wrapper) => wrapper.isIntersectingViewport)
		.map((wrapper) => wrapper.element);
	const elementsAdditional = wrappersToRefresh
		.filter(
			(wrapper) => wrapper.isIntersecting && !wrapper.isIntersectingViewport
		)
		.map((wrapper) => wrapper.element);

	try {
		const assignments = await cacheLabels(
			elementsNecessary,
			elementsAdditional
		);

		for (const wrapper of wrappersToRefresh) {
			wrapper.hint?.claim(assignments.get(wrapper.element));
		}
	} catch (error: unknown) {
		// We have already released every hint, so if claiming fails here the page
		// is left without any. The intersection retry will pick them back up once
		// the background script is reachable again.
		console.error("Rango: unable to refresh labels.", error);
		await rehintPending();
	}
}
