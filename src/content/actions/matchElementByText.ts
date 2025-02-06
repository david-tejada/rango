import Fuse from "fuse.js";
import { getBestFuzzyMatch } from "../../common/getBestFuzzyMatch";
import { deepGetElements } from "../dom/deepGetElements";
import { getIntersectingElements } from "../dom/getIntersectingElements";
import { isHintable } from "../dom/isHintable";
import { isVisible } from "../dom/isVisible";
import { getHintableSelector } from "../hints/selectors";
import { settingsSync } from "../settings/settingsSync";
import { getToggles } from "../settings/toggles";
import { getAllWrappers } from "../wrappers/wrappers";

const textMatchedElements = new Map<string, Element>();

type ElementMatch = {
	element: Element;
	match: { score: number; isHintable: boolean };
};

// Converting a NodeListOf<Element> to an array of elements might be slow if
// there are many elements. For this reason we avoid converting
// NodeListOf<Element> to an array of elements and pass references to the array
// or NodeListOf<Element> directly.

type ElementCollector = (
	viewportOnly: boolean
) => Promise<Element[] | NodeListOf<Element>>;

type MatchingStrategy = (
	text: string,
	elements: Element[] | NodeListOf<Element>
) => Promise<ElementMatch[]> | ElementMatch[];

const collectFromWrappers: ElementCollector = async (viewportOnly) => {
	// Not using `getHintedWrappers` here because we also want to get non hintables.
	const elements = getAllWrappers().map((wrapper) => wrapper.element);
	return viewportOnly ? getIntersectingElements(elements) : elements;
};

const collectHintablesFromLightDom: ElementCollector = async (viewportOnly) => {
	const hintableElements = document.querySelectorAll(getHintableSelector());
	return viewportOnly
		? getIntersectingElements(hintableElements)
		: hintableElements;
};

const collectWithDeepGetElements: ElementCollector = async (viewportOnly) => {
	const elements = deepGetElements(document.body, true);
	return viewportOnly ? getIntersectingElements(elements) : elements;
};

const defaultMatchingStrategy: MatchingStrategy = fuzzySearchElements;

const batchMatchingStrategy: MatchingStrategy = async (text, elements) => {
	const maxElementsToCheck = 25_000;
	const bestMatches = [];

	for (let offset = 0; offset < maxElementsToCheck; offset += 1000) {
		const elementsInBatch = Array.from(
			{ length: Math.min(1000, maxElementsToCheck - offset) },
			(_, i) => elements[offset + i]!
		).filter(Boolean);

		if (elementsInBatch.length === 0) break;

		const matches = fuzzySearchElements(text, elementsInBatch);

		// With this strategy we only check hintables for speed, so we don't need to
		// use `getBestFuzzyMatch`. We just return if we find an excellent match.
		const bestMatch = matches[0];
		if (bestMatch?.match.score && bestMatch.match.score < 0.1) {
			return [bestMatch];
		}

		if (bestMatch) bestMatches.push(bestMatch);
	}

	// If we weren't able to find an excellent match, search also in the viewport

	const viewportElements = await collectHintablesFromLightDom(true);
	const viewportMatches = fuzzySearchElements(text, viewportElements);

	return [...bestMatches, ...viewportMatches];
};

/**
 * Matches an element by its text content and stores the match in the
 * `textMatchedElements` map.
 *
 * @param text - The text to match.
 * @param viewportOnly - Whether to only match elements that are intersecting the viewport.
 * @returns The best match score or undefined if no match is found.
 */
export async function matchElementByText(text: string, viewportOnly: boolean) {
	const isComputingHintables =
		getToggles().computed || settingsSync.get("alwaysComputeHintables");
	const isLargePage = document.querySelectorAll("*").length > 25_000;

	const collector = isLargePage
		? collectHintablesFromLightDom
		: isComputingHintables
			? collectFromWrappers
			: collectWithDeepGetElements;

	const matchingStrategy =
		isLargePage && !viewportOnly
			? batchMatchingStrategy
			: defaultMatchingStrategy;

	const elements = await collector(viewportOnly);
	const matches = await matchingStrategy(text, elements);
	const bestMatch = getBestFuzzyMatch(matches);

	if (bestMatch) {
		// With non hintables, selecting the innermost element with the same text is
		// preferable for getting the pointer target. For example, in the language
		// selection sidebar in forvo.com it doesn't click the right element unless
		// we select the innermost element with the same text.
		if (!bestMatch.match.isHintable) {
			const descendants = Array.from(bestMatch.element.querySelectorAll("*"));
			const descendantsMatchingText = descendants.findLast(
				(descendant) =>
					getNormalizedTextContent(descendant) ===
					getNormalizedTextContent(bestMatch.element)
			);

			bestMatch.element = descendantsMatchingText ?? bestMatch.element;
		}

		textMatchedElements.set(text, bestMatch.element);
	}

	return bestMatch?.match;
}

function fuzzySearchElements(
	text: string,
	elements: Element[] | NodeListOf<Element>
) {
	const maxTextLengthToSearch = 200;
	const elementArray = Array.isArray(elements)
		? elements
		: Array.from(elements);
	const textMatchables = elementArray
		.map((element) => ({
			element,
			normalizedTextContent: getNormalizedTextContent(element),
		}))
		.filter(
			(matchable) =>
				matchable.normalizedTextContent.length > 0 &&
				matchable.normalizedTextContent.length < maxTextLengthToSearch
		);

	const fuse = new Fuse(textMatchables, {
		keys: ["normalizedTextContent"],
		ignoreLocation: true,
		includeScore: true,
		threshold: 0.4,
	});

	return fuse
		.search(text)
		.map((result) => ({
			element: result.item.element,
			match: {
				score: result.score!,
				isHintable: isHintable(result.item.element),
			},
		}))
		.filter(({ element }) => isVisible(element));
}

export function getTextMatchedElement(text: string) {
	const match = textMatchedElements.get(text);
	textMatchedElements.delete(text);
	return match;
}

function getNormalizedTextContent(element: Element) {
	return getTextContent(element)
		.replaceAll(/[^a-zA-Z\s]/g, " ")
		.replaceAll(/\s+/g, " ")
		.trim();
}

function getTextContent(element: Element) {
	if (element instanceof HTMLSelectElement) {
		return element.selectedOptions[0]?.textContent ?? "";
	}

	if (element.textContent) return element.textContent;

	const labels =
		"labels" in element
			? (element.labels as NodeListOf<HTMLLabelElement>)
			: undefined;

	const labelText = labels
		? [...labels].map((label) => label.textContent ?? "").join(" ")
		: "";

	return (element.textContent ?? "") + " " + labelText;
}
