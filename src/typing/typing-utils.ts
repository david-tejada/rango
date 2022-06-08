import { Intersector, HintedIntersector, FocusOnClickInput } from "./types";

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

export function isInputElement(element: Element): element is HTMLInputElement {
	return element.tagName === "INPUT";
}

export function isFocusOnClickInput(
	element: Element
): element is FocusOnClickInput {
	return (
		isInputElement(element) &&
		![
			"button",
			"checkbox",
			"color",
			"file",
			"hidden",
			"image",
			"radio",
			"reset",
			"submit",
		].includes(element.type)
	);
}

export function isHintedIntersector(
	intersector: Intersector
): intersector is HintedIntersector {
	return intersector.hintText !== undefined;
}
