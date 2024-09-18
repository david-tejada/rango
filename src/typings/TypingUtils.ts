export function assertDefined<T>(
	value: T | null | undefined,
	message?: string
): asserts value is T {
	if (value === null || value === undefined) {
		throw new Error(
			message ?? `Fatal error: value must not be null/undefined.`
		);
	}
}

export function isPromiseFulfilledResult<T>(
	result: PromiseSettledResult<T>
): result is PromiseFulfilledResult<T> {
	return result.status === "fulfilled";
}

export function hasPropertyValue(
	element: Element
): element is Element & { value: string } {
	return "value" in element;
}

export function hasPropertyDisabled(
	element: Element
): element is Element & { disabled: boolean } {
	return "disabled" in element;
}

export function isHtmlElement(element: Element): element is HTMLElement {
	return element instanceof HTMLElement;
}
