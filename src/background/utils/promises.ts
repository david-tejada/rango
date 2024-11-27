import {
	isPromiseFulfilledResult,
	isPromiseRejectedResult,
} from "../../typings/TypingUtils";

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

/**
 * Wraps a promise and returns a tuple of the promise's value and an error if
 * the promise is rejected.
 */
export async function promiseWrap<T>(
	promise: Promise<T>
): Promise<[T | undefined, any]> {
	return Promise.allSettled([promise]).then(([result]) => {
		return isPromiseFulfilledResult(result)
			? [result.value, undefined]
			: [undefined, result.reason];
	});
}
