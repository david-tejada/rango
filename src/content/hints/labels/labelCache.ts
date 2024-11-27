import { isMainFrame } from "../../setup/contentScriptContext";
import { reclaimLabels } from "../../wrappers/wrappers";
import {
	claimLabels,
	initStack,
	reclaimLabelsFromOtherFrames,
	releaseLabels,
} from "./labelRequest";
import { clearLabelsInFrame } from "./labelsInFrame";

/**
 * Labels that have been claimed for elements within the viewport. These labels
 * cannot be reclaimed by other frames.
 */
const mainCache: string[] = [];

/**
 * Labels that have been claimed for elements that are intersecting but not
 * within the viewport. These labels are susceptible to be reclaimed if a
 * different frame requires more.
 */
const additionalCache: string[] = [];

/**
 * Labels that have been returned to the cache using `pushLabel`.
 */
const returnedLabels: string[] = [];

/**
 * Caches labels that can be later `popped` when a wrapper needs them.
 *
 * @param necessaryCount - The number of labels that are absolutely necessary.
 * They are intended for elements that are within the viewport.
 * @param additionalCount - The number of labels that are additional to the
 * necessary ones. They are intended for elements that are intersecting but not
 * within the viewport.
 */
export async function cacheLabels(
	necessaryCount: number,
	additionalCount: number
) {
	const totalCount = necessaryCount + additionalCount;
	const requestCount = totalCount - returnedLabels.length;

	// Save any previously returned labels
	saveLabelsToCache([...returnedLabels]);
	returnedLabels.length = 0;

	// If we have excess labels, return them to the stack
	if (requestCount <= 0) {
		await releaseLabels(mainCache.splice(0, -requestCount));
		return;
	}

	const minimumCount = Math.min(requestCount, necessaryCount);
	const labelsClaimed = await claimLabels(requestCount);

	// If there are not enough labels available we try to reclaim those labels
	// that are outside of the viewport in the same frame (for speed)
	if (labelsClaimed.length < minimumCount) {
		const reclaimedLabels = reclaimLabels(
			necessaryCount - labelsClaimed.length
		);
		labelsClaimed.push(...reclaimedLabels);
	}

	// If after that there're still not enough labels available we reclaim
	// labels that are outside of the viewport from others frames
	if (labelsClaimed.length < minimumCount) {
		const reclaimedLabels = await reclaimLabelsFromOtherFrames(
			necessaryCount - labelsClaimed.length
		);
		labelsClaimed.push(...reclaimedLabels);
	}

	saveLabelsToCache(labelsClaimed, necessaryCount);
}

export function popLabel(): string | undefined {
	let label = mainCache.pop() ?? additionalCache.pop();

	if (!label) {
		// If there are no labels remaining in the cache we see if we can retrieve
		// the labels in the current frame that are not intersecting the viewport
		[label] = reclaimLabels(1);
	}

	return label;
}

export function pushLabel(label: string) {
	returnedLabels.push(label);
}

/**
 * Saves labels to the cache.
 *
 * @param labels - The labels to save.
 * @param toMain - The number of labels that should be saved to the main cache.
 */
function saveLabelsToCache(labels: string[], toMain = 0) {
	const labelsSorted = [...labels].sort(
		(a, b) => b.length - a.length || b.localeCompare(a)
	);

	const [labelsToAdditional, labelsToMain] = [
		labelsSorted.slice(0, -toMain),
		labelsSorted.slice(-toMain),
	];

	mainCache.push(...labelsToMain);
	additionalCache.push(...labelsToAdditional);

	sortCache();
}

/**
 * Sorts the labels in the cache.
 * The sorted array will be like this: `["zz", "zy", "zx", ..., "c", "b", "a"]`
 */
function sortCache() {
	mainCache.sort((a, b) => b.length - a.length || b.localeCompare(a));
	additionalCache.sort((a, b) => b.length - a.length || b.localeCompare(a));
}

export function reclaimLabelsFromCache(amount: number) {
	return additionalCache.splice(-amount, amount);
}

/**
 * Clears the labels cache and resets the stack if it's the main frame.
 */
export async function clearLabelsCache() {
	mainCache.length = 0;
	additionalCache.length = 0;
	returnedLabels.length = 0;

	clearLabelsInFrame();

	if (isMainFrame()) await initStack();
}

/**
 * Returns the labels in the cache. This function is just used for debugging
 * purposes.
 *
 * @returns The labels in the cache.
 */
export function getLabelCache() {
	return { main: mainCache, additional: additionalCache };
}
