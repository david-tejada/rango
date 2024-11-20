import { resetStagedSelectors } from "../hints/customSelectorsStaging";
import { cacheLabels, clearLabelsCache } from "../hints/labelCache";
import { refresh } from "../wrappers/refresh";
import { getHintedWrappers } from "../wrappers/wrappers";
import { resetExtraHintsToggles } from "./customHints";

export async function refreshHints() {
	await resetStagedSelectors();
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

	await clearLabelsCache();

	const labelsNecessary = wrappersToRefresh.filter(
		(wrapper) => wrapper.isIntersectingViewport
	).length;
	const labelsAdditional = wrappersToRefresh.filter(
		(wrapper) => wrapper.isIntersecting && !wrapper.isIntersectingViewport
	).length;

	await cacheLabels(labelsNecessary, labelsAdditional);

	for (const wrapper of wrappersToRefresh) {
		wrapper.hint?.claim();
	}
}
