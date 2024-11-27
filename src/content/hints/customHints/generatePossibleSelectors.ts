import combinations from "combinations";
import { calculate } from "specificity";
import { combineArrays } from "./combineArrays";

/**
 * Given an array of selectors for elements starting from the root until the
 * target element, it returns an array of all the possible selectors that would
 * match the target element. Tag names that include ids or classes won't appear
 * by themselves in the return value (for example, not "div div main article
 * div.button", but this instead will appear "div.root main div.button").
 *
 * @param selectors The array of selectors for elements starting from the root until the target element
 * @param maxClasses The maximum amount of classes to include for a given selector
 * @returns An array of selectors that would match the target element
 *
 * @example
 *
 * generatePossibleSelectors(["html.no-js", "main", "div#page.my-page", "div.button.button-primary"])
 * // ["div",
 * // ".button",
 * // ".button-primary",
 * // "div.button",
 * // "div.button-primary",
 * // ...49 more items
 * // "html.no-js main div.my-page .button.button-primary",
 * // "html.no-js main div.my-page div.button.button-primary"]
 */
export function generatePossibleSelectors(
	selectors: string[],
	maxClasses = 7
): string[] {
	// Because generating all the possible selectors could be costly if there are
	// too many selectors, we need to limit the amount of selectors that we
	// include
	const selectorsTrimmed: string[] = [];
	let classesAdded = 0;

	// We need to reverse the selectors because we want to keep the selector parts
	// closest to the target
	for (const selector of [...selectors].reverse()) {
		const parts = calculate(selector)[0]!.parts;
		const selectorParts = parts.map((part) => part.selector);

		// If the selector is just the tag we included it
		if (selectorParts.length === 1) {
			selectorsTrimmed.unshift(selectorParts[0]!);
		} else {
			let filteredSelector = "";
			for (const part of selectorParts) {
				if (/^[.:]/.test(part) && classesAdded < maxClasses) {
					classesAdded++;
					filteredSelector += part;
				}
			}

			if (filteredSelector) {
				// We always include the tag
				filteredSelector = selectorParts[0]! + filteredSelector;
				selectorsTrimmed.unshift(filteredSelector);
			}
		}
	}

	// We remove the target selector so it isn't included in the combinations. If
	// we, for example, had ["div.parent", "div.child", "a.target"] calling
	// combinations on this would give us ["div.parent", "div.child"] and
	// ["div.parent", "a.target"] what would be unusable. That's why we remove the
	// target and add it then for every selector.
	const targetSelector = selectorsTrimmed.pop();

	// Example of combinedSelectors for ["div#id1", "div#id2", "ul.class1"]:
	// [
	//  [ "div#id1" ], [ "div#id2" ], [ "ul.class1" ], [ "div#id1", "div#id2" ],
	// 	[ "div#id1", "ul.class1" ], [ "div#id2", "ul.class1" ],
	// 	[ "div#id1", "div#id2", "ul.class1" ]
	// ]
	const combinedSelectors = combinations(selectorsTrimmed);

	for (const selectors of combinedSelectors) {
		selectors.push(targetSelector!);
	}

	combinedSelectors.unshift([targetSelector!]);

	// Here we expand the combinations so that we get all the possible
	// combinations of ids and classes (and also tag for the target)
	const result: string[] = [];

	for (const selectorList of combinedSelectors) {
		// The variable selectorListCombined is the same length as selectorList and
		// for each selector it contains all the possible variations of the selector
		// (value that we get from selectorCombined)
		const selectorListCombined: string[][] = [];
		for (const [index, selector] of selectorList.entries()) {
			const parts = calculate(selector)[0]!.parts;
			const selectors = parts.map((part) => part.selector);

			let selectorCombined: string[];

			// This will be true for the target selector. For this one we also want to
			// include the tag by itself, so that we get selectors like ".media a"
			if (index === selectorList.length - 1) {
				selectorCombined = combinations(selectors).map((selectors) =>
					selectors.join("")
				);
			} else {
				const tagName = selectors.shift();
				selectorCombined = combinations(selectors).map(
					(selectors) => `${tagName!}${selectors.join("")}`
				);
			}

			selectorListCombined.push(selectorCombined);
		}

		// This combines all the possible selectors at each dom level
		const combined = combineArrays(selectorListCombined).map((array) =>
			array.join(" ")
		);
		result.push(...combined);
	}

	return result;
}
