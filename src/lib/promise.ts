import {
	isPromiseFulfilledResult,
	isPromiseRejectedResult,
} from "../typings/TypingUtils";

/**
 * Returns the results of `Promise.allSettled` grouped into fulfilled and rejected
 * categories, with easy access to fulfilled values.
 */
export async function promiseAllSettledGrouped<T>(promises: Array<Promise<T>>) {
	const allResults = await Promise.allSettled(promises);
	const results = allResults
		.filter((result) => isPromiseFulfilledResult(result))
		.map((result) => result.value);
	const rejected = allResults.filter((result) =>
		isPromiseRejectedResult(result)
	);

	return {
		results,
		rejected,
	};
}
