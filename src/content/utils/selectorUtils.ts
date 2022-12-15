import { calculate } from "specificity";

export function getSpecificityValue(selector: string) {
	const { specificityArray } = calculate(selector)[0]!;

	return (specificityArray as number[]).reduce(
		(acc, curr, index, array) => acc + curr * 10 ** (array.length - index - 1)
	);
}

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
