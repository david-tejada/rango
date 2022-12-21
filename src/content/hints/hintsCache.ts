import { claimHints, initStack, releaseHints } from "./hintsRequests";

let hintsCache: string[] = [];
let returnedHints: string[] = [];

// This function is called from the intersection observer callback on every intersection.
export async function cacheHints(amount: number) {
	const returnedHintsAmount = returnedHints.length;
	if (returnedHintsAmount > 0) {
		hintsCache.push(...returnedHints.splice(0, returnedHintsAmount));
	}

	const hintsToRequest = amount - returnedHintsAmount;

	if (hintsToRequest > 0) {
		const hints = await claimHints(hintsToRequest);
		hintsCache.push(...hints);
	} else {
		await releaseHints(hintsCache.splice(0, hintsToRequest));
	}

	hintsCache.sort((a, b) => b.length - a.length || b.localeCompare(a));
}

export function popHint(): string | undefined {
	const hint = hintsCache.pop();
	return hint;
}

export function pushHint(hints: string | string[], keepInCache = false) {
	hints = typeof hints === "string" ? [hints] : hints;

	if (keepInCache) {
		hintsCache.push(...hints);
	} else {
		returnedHints.push(...hints);
	}
}

export async function clearHintsCache() {
	hintsCache = [];
	returnedHints = [];

	// We don't need to worry about this being called in every frame because
	// frames other than 0 are ignored within the function
	await initStack();
}
