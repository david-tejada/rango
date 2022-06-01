/* eslint-disable @typescript-eslint/ban-types */
export function assertDefined<T>(
	value: T | null | undefined
): asserts value is T {
	if (value === null || value === undefined) {
		throw new Error(`Fatal error: value must not be null/undefined.`);
	}
}
