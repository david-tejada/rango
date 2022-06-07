/* eslint-disable @typescript-eslint/ban-types */
export function assertDefined<T>(
	value: T | null | undefined
): asserts value is T {
	if (value === null || value === undefined) {
		throw new Error(`Fatal error: value must not be null/undefined.`);
	}
}

export function isTextNode(node: Node): node is Text {
	return node.nodeType === Node.TEXT_NODE;
}

export function isElementNode(node: Node): node is Element {
	return node.nodeType === Node.ELEMENT_NODE;
}
