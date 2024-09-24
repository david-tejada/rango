import { calculate } from "specificity";

export function getSpecificityValue(selector: string) {
	const { specificityArray } = calculate(selector)[0]!;

	return (specificityArray as number[]).reduce(
		(accumulator, current, index, array) =>
			accumulator + current * 10 ** (array.length - index - 1)
	);
}

/**
 * Check if a given selector is valid, that is, it doesn't error when used as
 * the argument for methods like document.querySelector and
 * document.querySelectorAll.
 *
 * @param selector The string to check if it's a valid selector
 * @returns true if the selector is valid and false if not
 */
export function isValidSelector(selector: string) {
	try {
		document.querySelector(selector);
	} catch (error: unknown) {
		if (error instanceof DOMException) {
			return false;
		}
	}

	return true;
}

export function selectorToArray(selector: string) {
	const specificity = calculate(selector);
	return specificity[0]!.parts.map((part) => part.selector);
}
