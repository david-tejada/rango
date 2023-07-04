import intersect from "intersect";
import { ElementWrapper } from "../../typings/ElementWrapper";
import { deepGetElements } from "../utils/deepGetElements";
import { generatePossibleSelectors } from "../utils/generatePossibleSelectors";
import {
	getSpecificityValue,
	isValidSelector,
	selectorToArray,
} from "../utils/selectorUtils";
import {
	pickSelectorAlternative,
	SelectorAlternative,
	updateSelectorAlternatives,
} from "./customSelectorsStaging";

function getChildNumber(target: Element) {
	if (!target.parentElement) return undefined;

	for (const [index, element] of [...target.parentElement.children].entries()) {
		if (element === target) return index + 1;
	}

	return undefined;
}

/**
 * Get the CSS selector for the target Element. It will return a selector in the
 * shape of `div#banner.button.button-red`.
 *
 * @param target The Element to retrieve its CSS selector
 * @returns The CSS selector for the Element
 */
function getSelector(target: Element) {
	let result = target.tagName.toLowerCase();

	if (
		target.id &&
		// We don't take into account ids with problematic characters
		!/[.:]/.test(target.id) &&
		isValidSelector(`#${target.id}`)
	) {
		result += `#${target.id}`;
	}

	if (target.classList.length > 0) {
		const classSelector = `.${[...target.classList].join(".")}`;
		if (isValidSelector(classSelector)) result += classSelector;
	}

	return result;
}

function getAncestorWithSignificantSelector(target: Element) {
	const closest = target.parentElement?.closest(
		":is([class], [id]):not([class=''], [id='']), ul, ol, nav, header, footer, main, aside, article, section"
	);

	return closest ?? undefined;
}

/**
 * Get an array of significant selectors starting from the root of the DOM until
 * the target Element. Examples of non-significant selectors would be `div`, `a`
 * or `button`.
 *
 * @param target An Element
 * @returns An array of significant selectors starting from the root of the DOM
 *
 * @example
 *
 * getSignificantSelectors(document.querySelector(".button-red"))
 * // [ "html.no-js", "main", "div#page.my-page", "div.button.button-nice.button-red" ]
 *
 */
function getSignificantSelectors(target: Element) {
	const result: string[] = [];

	let next: Element | undefined = target;
	while (next) {
		const selector = getSelector(next);
		if (selector) result.unshift(selector);
		next = getAncestorWithSignificantSelector(next);
	}

	// We remove duplicates for simplicity even though the same class name could
	// be used at different levels
	return [...new Set(result)];
}

/**
 * Given an array of selectors for elements starting from root until the target
 * element, return selector alternatives that match different amount of
 * elements. For a given amount of elements matching we just take the
 * selector with the lowest specificity or the first one we encounter. For
 * example, if the selectors ".button-primary" and "div.button-primary" match
 * two elements each we would just take ".button-primary" as the specificity is
 * lower.
 *
 * @param selectorList And array of selectors for elements starting from root until the target element
 * @returns An array of objects in the shape { selector, specificity, elementsMatching }. Ordered by the amount of elements matching.
 *
 * @example
 *
 * getSelectorAlternatives(["html.no-js", "main", "div#page.my-page", "div.button.button-primary"])
 * // [
 * //   {
 * //     "selector": ".button-primary",
 * //     "specificity": 10,
 * //     "elementsMatching": 2
 * //   },
 * //   {
 * //     "selector": "div.my-page div",
 * //     "specificity": 12,
 * //     "elementsMatching": 4
 * //   },
 * //   {
 * //     "selector": "div",
 * //     "specificity": 1,
 * //     "elementsMatching": 5
 * //   }
 * // ]
 * //
 */
function getSelectorAlternatives(selectorList: string[]) {
	const possibleSelectors = generatePossibleSelectors(selectorList);

	const alternatives: SelectorAlternative[] = [];

	for (const selector of possibleSelectors) {
		let amountOfElementsMatching = 0;

		try {
			// We use querySelectorAll here for speed as deepGetElements is much
			// slower
			amountOfElementsMatching = document.querySelectorAll(selector).length;
		} catch (error: unknown) {
			if (error instanceof DOMException) {
				amountOfElementsMatching = 0;
			}
		}

		// If no element match the selector the elements are shadow dom elements
		if (!amountOfElementsMatching) {
			amountOfElementsMatching = deepGetElements(
				document.body,
				false,
				selector
			).length;
		}

		const specificityValue = getSpecificityValue(selector);

		const alternativeWithSameMatching = alternatives.find(
			(alternative) => alternative.elementsMatching === amountOfElementsMatching
		);

		if (!alternativeWithSameMatching) {
			alternatives.push({
				selector,
				specificity: specificityValue,
				elementsMatching: amountOfElementsMatching,
			});
		} else if (specificityValue <= alternativeWithSameMatching.specificity) {
			// For every selector alternative that matches a certain amount of
			// elements we want to store the lowest specificity selector. This is so
			// that if we include selectors in one page they would match similar
			// selector in different pages/areas of the page. Because of the order of
			// selectors returned by generatePossibleSelectors this also ensures that
			// using "<=" we get selectors closes to the target element.
			alternativeWithSameMatching.selector = selector;
			alternativeWithSameMatching.specificity = specificityValue;
		}
	}

	return alternatives.sort((a, b) => {
		if (a.elementsMatching > b.elementsMatching) return +1;
		if (a.elementsMatching < b.elementsMatching) return -1;
		return 0;
	});
}

/**
 * Given an array of Elements get an array of common significant selectors
 * starting from the root until the target Element.
 *
 * @param targets An array of Elements to compute the list of common selectors
 * @returns An array of common selectors for the target elements
 *
 * @example
 *
 * // Given targets with these significant selectors:
 * // [
 * //   [
 * //     "html.no-js",
 * //     "main",
 * //     "div#page.my-page",
 * //     "div.button.button-primary"
 * //   ],
 * //   [
 * //     "html.no-js",
 * //     "main",
 * //     "div#page.my-page",
 * //     "div.button.button-secondary"
 * //   ]
 * // ]
 *
 * getCommonSelectors(targets)
 * // [ "html.no-js", "main", "div#page.my-page", "div.button" ]
 */
function getCommonSelectors(targets: Element[]) {
	const selectorLists = targets.map((element) =>
		getSignificantSelectors(element)
	);

	const targetSelectors: Set<string> = new Set();

	for (const list of selectorLists) {
		const targetSelector = list[list.length - 1];
		if (targetSelector) targetSelectors.add(targetSelector);
	}

	let commonTargetSelectors: string[] | undefined;

	for (const selector of targetSelectors) {
		const parts = selectorToArray(selector);
		commonTargetSelectors = commonTargetSelectors
			? intersect(commonTargetSelectors, parts)
			: parts;
	}

	// It the target elements don't have any tag, id or class in common we return
	if (!commonTargetSelectors) return [];

	let targetSelector = commonTargetSelectors.join("");

	// If all the target elements are the same child number we can narrow down the
	// selector even more
	const firstTargetChildNumber = targets[0]
		? getChildNumber(targets[0])
		: undefined;

	if (
		firstTargetChildNumber &&
		[...targets].every(
			(target) => getChildNumber(target) === firstTargetChildNumber
		)
	) {
		targetSelector += `:nth-child(${firstTargetChildNumber})`;
	}

	for (const list of selectorLists) {
		list[list.length - 1] = targetSelector;
	}

	return intersect(selectorLists);
}

/**
 * Computes the custom selectors for a given array of ElementWrappers. This
 * function does NOT refresh the hints.
 *
 * @param wrappers An array of ElementWrappers
 * @param mode "include" or "exclude"
 * @returns The selectors that have been affected
 */
export async function computeCustomSelectors(
	wrappers: ElementWrapper[],
	mode: "include" | "exclude"
) {
	const elements = wrappers.map((wrapper) => wrapper.element);

	const commonSelectors = getCommonSelectors(elements);
	if (commonSelectors.length === 0) return;

	const selectorAlternatives = getSelectorAlternatives(commonSelectors);
	updateSelectorAlternatives(selectorAlternatives);
	const selectorsToRefresh = pickSelectorAlternative({ mode });
	return selectorsToRefresh;
}

async function includeOrExcludeMoreOrLessSelectors(more: boolean) {
	const step = more ? 1 : -1;
	const selectorsAffected = pickSelectorAlternative({ step });
	return selectorsAffected;
}

/**
 * Pick the next selector alternative with more matches and update the custom
 * selectors accordingly. This function does NOT refresh the hints.
 *
 * @returns The selectors that have been affected
 */
export async function customSelectorsMore() {
	return includeOrExcludeMoreOrLessSelectors(true);
}

/**
 * Pick the next selector alternative with less matches and update the custom
 * selectors accordingly. This function does NOT refresh the hints.
 *
 * @returns The selectors that have been affected
 */
export async function customSelectorsLess() {
	return includeOrExcludeMoreOrLessSelectors(false);
}
