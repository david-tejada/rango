import { resetStagedSelectors } from "../hints/customSelectorsStaging";
import { cacheHints, clearHintsCache } from "../hints/hintsCache";
import { refresh } from "../wrappers/refresh";
import { getHintedWrappers } from "../wrappers/wrappers";
import { resetExtraHintsToggles } from "./customHints";

export async function refreshHints() {
	await resetStagedSelectors();
	resetExtraHintsToggles();

	await refresh({ hintsStyle: true, isHintable: true });
	await refreshHintsCharacters();
}

/**
 * Clear the hints cache and refresh the characters for all hinted wrappers.
 *
 * Note: There are potential race conditions in this refresh process.
 *
 * The code related to intersection callbacks is considered safe since
 * `claimHints` would claim or release hints from the stack and that is protected
 * by the mutexes. It will wait until the mutexes are released and the stack has
 * been reset.
 *
 * Other potentially problematic circumstances include:
 * - Reattaching hints deleted by the page
 * - `Wrapper.resizeObserver` being called, resulting in pushing or popping hints
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
async function refreshHintsCharacters() {
	const wrappersToRefresh = getHintedWrappers();
	for (const wrapper of wrappersToRefresh) wrapper.hint?.release();

	await clearHintsCache();

	const hintsNecessary = wrappersToRefresh.filter(
		(wrapper) => wrapper.isIntersectingViewport
	).length;
	const hintsAdditional = wrappersToRefresh.filter(
		(wrapper) => wrapper.isIntersecting && !wrapper.isIntersectingViewport
	).length;

	await cacheHints(hintsNecessary, hintsAdditional);

	for (const wrapper of wrappersToRefresh) {
		wrapper.hint?.claim();
	}
}
