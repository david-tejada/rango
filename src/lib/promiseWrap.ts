import { isPromiseFulfilledResult } from "../typings/TypingUtils";

export async function promiseWrap(promise: Promise<unknown>) {
	return Promise.allSettled([promise]).then(([result]) => {
		return isPromiseFulfilledResult(result)
			? [result.value, undefined]
			: [undefined, result.reason];
	});
}
