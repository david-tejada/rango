import intersect from "intersect";
import { ElementWrapper } from "../../typings/ElementWrapper";
import {
	displayMoreOrLessHints,
	updateHintablesBySelector,
	updateRecentCustomSelectors,
} from "../updateWrappers";
import { deepGetElements } from "../utils/deepGetElements";
import { updateCustomSelectors } from "../hints/selectors";
import { generatePossibleSelectors } from "../utils/generatePossibleSelectors";
import {
	getSpecificityValue,
	isValidSelector,
	selectorToArray,
} from "../utils/selectorUtils";
import {
	pickSelectorAlternative,
	SelectorAlternative,
	storeCustomSelectors,
	updateSelectorAlternatives,
} from "../hints/customHintsEdit";

function getChildNumber(target: Element) {
	if (!target.parentElement) return undefined;

	for (const [index, element] of [...target.parentElement.children].entries()) {
		if (element === target) return index + 1;
	}

	return undefined;
}

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

function getSelectorAlternatives(selectorList: string[]) {
	const possibleSelectors = generatePossibleSelectors(selectorList);

	const alternatives: SelectorAlternative[] = [];

	for (const selector of possibleSelectors) {
		let amountOfElementsMatching;

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

function getCommonSelectors(targets: Element[]) {
	const selectorLists = targets.map((element) =>
		getSignificantSelectors(element)
	);

	const targetSelectors: Set<string> = new Set();

	for (const list of selectorLists) {
		targetSelectors.add(list[list.length - 1]);
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
	const firstTargetChildNumber = getChildNumber(targets[0]);

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

export function includeOrExcludeExtraSelectors(
	wrappers: ElementWrapper[],
	mode: "include" | "exclude"
) {
	const elements = wrappers.map((wrapper) => wrapper.element);

	const commonSelectors = getCommonSelectors(elements);
	if (commonSelectors.length === 0) return;

	updateSelectorAlternatives(getSelectorAlternatives(commonSelectors));
	pickSelectorAlternative({ mode });
	updateRecentCustomSelectors();
}

export function includeOrExcludeMoreOrLessSelectors(more: boolean) {
	const step = more ? 1 : -1;
	pickSelectorAlternative({ step });
	updateRecentCustomSelectors();
}

export async function saveCustomSelectors() {
	const addedSelectors = await storeCustomSelectors();
	await updateCustomSelectors();
	updateHintablesBySelector(addedSelectors.join(", "));
	displayMoreOrLessHints({ extra: false, excluded: false });
}
