export function assertDefined<T>(
	value: T | null | undefined,
	message = "Value is null or undefined"
): asserts value is T {
	if (value === null || value === undefined) {
		throw new Error(message);
	}
}

export function isPromiseFulfilledResult<T>(
	result: PromiseSettledResult<T>
): result is PromiseFulfilledResult<T> {
	return result.status === "fulfilled";
}

export function isPromiseRejectedResult<T>(
	result: PromiseSettledResult<T>
): result is PromiseRejectedResult {
	return result.status === "rejected";
}

export function hasPropertyDisabled(
	element: Element
): element is Element & { disabled: boolean } {
	return "disabled" in element;
}

export function isHtmlElement(element: Element): element is HTMLElement {
	return element instanceof HTMLElement;
}
