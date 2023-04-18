import { isPromiseFulfilledResult } from "../typings/TypingUtils";

export async function promiseWrap<T>(
	promise: Promise<T>
): Promise<[T | undefined, any]> {
	return Promise.allSettled([promise]).then(([result]) => {
		return isPromiseFulfilledResult(result)
			? [result.value, undefined]
			: [undefined, result.reason];
	});
}
