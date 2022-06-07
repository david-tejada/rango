import { Intersector, HintedIntersector } from "./types";

export function assertDefined<T>(
	value: T | null | undefined // eslint-disable-line @typescript-eslint/ban-types
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

export function isLinkElement(element: Element): element is HTMLLinkElement {
	return element.tagName === "A";
}

export function isHintedIntersector(
	intersector: Intersector
): intersector is HintedIntersector {
	return intersector.hintText !== undefined;
}
