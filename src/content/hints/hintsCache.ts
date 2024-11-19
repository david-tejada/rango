import { isMainFrame } from "../setup/contentScriptContext";
import { reclaimHints } from "../wrappers/wrappers";
import { clearHintsInFrame } from "./hintsInFrame";
import {
	claimHints,
	initStack,
	reclaimHintsFromOtherFrames,
	releaseHints,
} from "./hintsRequests";

/**
 * Hints that have been claimed for elements within the viewport. These hints
 * cannot be reclaimed by other frames.
 */
const mainCache: string[] = [];

/**
 * Hints that have been claimed for elements that are intersecting but not
 * within the viewport. These hints are susceptible to be reclaimed if a
 * different frame requires more.
 */
const additionalCache: string[] = [];

/**
 * Hints that have been returned to the cache using `pushHint`.
 */
const returnedHints: string[] = [];

/**
 * Caches hints that can be later `popped` when a wrapper needs them.
 *
 * @param necessaryCount - The number of hints that are absolutely necessary.
 * They are intended for elements that are within the viewport.
 * @param additionalCount - The number of hints that are additional to the
 * necessary ones. They are intended for elements that are intersecting but not
 * within the viewport.
 */
export async function cacheHints(
	necessaryCount: number,
	additionalCount: number
) {
	const totalCount = necessaryCount + additionalCount;
	const requestCount = totalCount - returnedHints.length;

	// Save any previously returned hints
	saveHintsToCache([...returnedHints]);
	returnedHints.length = 0;

	// If we have excess hints, return them to the stack
	if (requestCount <= 0) {
		await releaseHints(mainCache.splice(0, -requestCount));
		return;
	}

	const minimumCount = Math.min(requestCount, necessaryCount);
	const hintsClaimed = await claimHints(requestCount);

	// If there are not enough hints available we try to reclaim those hints
	// that are outside of the viewport in the same frame (for speed)
	if (hintsClaimed.length < minimumCount) {
		const reclaimedHints = reclaimHints(necessaryCount - hintsClaimed.length);
		hintsClaimed.push(...reclaimedHints);
	}

	// If after that there're still not enough hints available we reclaim
	// hints that are outside of the viewport from others frames
	if (hintsClaimed.length < minimumCount) {
		const reclaimedHints = await reclaimHintsFromOtherFrames(
			necessaryCount - hintsClaimed.length
		);
		hintsClaimed.push(...reclaimedHints);
	}

	saveHintsToCache(hintsClaimed, necessaryCount);
}

export function popHint(): string | undefined {
	let hint = mainCache.pop() ?? additionalCache.pop();

	if (!hint) {
		// If there are no hints remaining in the cache we see if we can retrieve
		// the hints in the current frame that are not intersecting the viewport
		[hint] = reclaimHints(1);
	}

	return hint;
}

export function pushHint(hint: string) {
	returnedHints.push(hint);
}

/**
 * Saves hints to the cache.
 *
 * @param hints - The hints to save.
 * @param toMain - The number of hints that should be saved to the main cache.
 */
function saveHintsToCache(hints: string[], toMain = 0) {
	const hintsSorted = [...hints].sort(
		(a, b) => b.length - a.length || b.localeCompare(a)
	);

	const [hintsToAdditional, hintsToMain] = [
		hintsSorted.slice(0, -toMain),
		hintsSorted.slice(-toMain),
	];

	mainCache.push(...hintsToMain);
	additionalCache.push(...hintsToAdditional);

	sortCache();
}

/**
 * Sorts the hints in the cache.
 * The sorted array will be like this: `["zz", "zy", "zx", ..., "c", "b", "a"]`
 */
function sortCache() {
	mainCache.sort((a, b) => b.length - a.length || b.localeCompare(a));
	additionalCache.sort((a, b) => b.length - a.length || b.localeCompare(a));
}

export function reclaimHintsFromCache(amount: number) {
	return additionalCache.splice(-amount, amount);
}

/**
 * Clears the hints cache and resets the stack if it's the main frame.
 */
export async function clearHintsCache() {
	mainCache.length = 0;
	additionalCache.length = 0;
	returnedHints.length = 0;

	clearHintsInFrame();

	if (isMainFrame()) await initStack();
}

/**
 * Returns the hints in the cache. This function is just used for debugging
 * purposes.
 *
 * @returns The hints in the cache.
 */
export function getHintsCache() {
	return { main: mainCache, additional: additionalCache };
}
