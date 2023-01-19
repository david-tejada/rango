import { reclaimHints } from "../wrappers";
import {
	claimHints,
	initStack,
	reclaimHintsFromOtherFrames,
	releaseHints,
} from "./hintsRequests";

let mainCache: string[] = [];
let additionalCache: string[] = [];
let returnedHints: string[] = [];

// This function is called from the intersection observer callback on every
// intersection.
export async function cacheHints(necessary: number, additional: number) {
	const total = necessary + additional;

	const hintsToRequest = total - returnedHints.length;

	if (returnedHints.length > 0) {
		saveHintsToCache(returnedHints.splice(0, returnedHints.length));
	}

	if (hintsToRequest > 0) {
		const hints = await claimHints(hintsToRequest);

		if (hints.length < Math.min(hintsToRequest, necessary)) {
			// If there are not enough hints available we try to reclaim those hints
			// that are outside of the viewport in the same frame (for speed)
			hints.push(...reclaimHints(necessary - hints.length));
		}

		if (hints.length < necessary) {
			// If after that there're still not enough hints available we reclaim
			// hints that are outside of the viewport from others frames
			const additionalHints = await reclaimHintsFromOtherFrames(
				necessary - hints.length
			);
			saveHintsToCache(additionalHints);
		}

		saveHintsToCache(hints, necessary);
	} else {
		// We return the excess hints to the stack
		await releaseHints(mainCache.splice(0, -hintsToRequest));
	}
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

function saveHintsToCache(hints: string[], toMain?: number) {
	const hintsToAdditional = [...hints];
	const hintsToMain: string[] = toMain
		? hintsToAdditional.splice(-toMain, toMain)
		: hintsToAdditional.splice(0, hints.length);

	mainCache.push(...hintsToMain);
	additionalCache.push(...hintsToAdditional);
	mainCache.sort((a, b) => b.length - a.length || b.localeCompare(a));
	additionalCache.sort((a, b) => b.length - a.length || b.localeCompare(a));
}

export function reclaimHintsFromCache(amount: number) {
	return additionalCache.splice(-amount, amount);
}

export async function clearHintsCache() {
	mainCache = [];
	additionalCache = [];
	returnedHints = [];

	// We don't need to worry about this being called in every frame because
	// frames other than 0 are ignored within the function
	await initStack();
}

// For debugging purposes
export function getHintsCache() {
	return { main: mainCache, additional: additionalCache };
}
