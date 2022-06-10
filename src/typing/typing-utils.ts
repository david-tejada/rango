import { Intersector, HintedIntersector, FocusOnClickInput } from "./types";

export function assertDefined<T>(
	value: T | null | undefined // eslint-disable-line @typescript-eslint/ban-types
): asserts value is T {
	if (value === null || value === undefined) {
		throw new Error(`Fatal error: value must not be null/undefined.`);
	}
}

export function isFocusOnClickInput(
	element: Element
): element is FocusOnClickInput {
	return (
		element instanceof HTMLInputElement &&
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
