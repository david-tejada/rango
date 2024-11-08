import { isPromiseFulfilledResult } from "../typings/TypingUtils";

/**
 * Return an array of the fulfilled values of an array of promises.
 */
export async function promiseAllSettledFulfilledValues<T>(
	promises: Array<Promise<T>>
) {
	const results = await Promise.allSettled(promises);
	return results
		.filter((result) => isPromiseFulfilledResult(result))
		.map((result) => result.value);
}
