import Fuse from "fuse.js";
import { deepGetElements } from "../dom/deepGetElements";
import { isHintable } from "../dom/isHintable";
import { isVisible } from "../dom/isVisible";
import { getSetting } from "../settings/settingsManager";
import { getToggles } from "../settings/toggles";
import { getAllWrappers } from "../wrappers/wrappers";

type TextMatchable = {
	element: Element;
	normalizedTextContent: string;
};

const textMatchedElements = new Map<string, Element>();

/**
 * Matches an element by its text content and stores the match in the
 * `textMatchedElements` map.
 *
 * @param text - The text to match.
 * @param viewportOnly - Whether to only match elements that are intersecting the viewport.
 * @returns The best match score or undefined if no match is found.
 */
export async function matchElementByText(text: string, viewportOnly: boolean) {
	const matchableElements = await getTextMatchableElements(viewportOnly);

	const fuse = new Fuse(matchableElements, {
		keys: ["normalizedTextContent"],
		ignoreLocation: true,
		includeScore: true,
		threshold: 0.4,
	});

	const matches = fuse.search(text);

	if (matches.length === 0) return;

	const bestMatch = matches[0]!;
	textMatchedElements.set(text, bestMatch.item.element);

	return bestMatch.score;
}

export function getTextMatchedElement(text: string) {
	const match = textMatchedElements.get(text);
	textMatchedElements.delete(text);
	return match;
}

async function getTextMatchableElements(
	viewportOnly: boolean
): Promise<TextMatchable[]> {
	// Hints are on or alwaysComputeHintables is on. There will be wrappers for
	// the hintable elements.
	if (getToggles().computed || getSetting("alwaysComputeHintables")) {
		return getAllWrappers()
			.filter((wrapper) => wrapper.isHintable && isVisible(wrapper.element))
			.filter((wrapper) =>
				viewportOnly ? wrapper.isIntersectingViewport : true
			)
			.map((wrapper) => ({
				element: wrapper.element,
				normalizedTextContent: normalizeTextContent(wrapper.element),
			}))
			.filter((matchable) => matchable.normalizedTextContent.length > 0);
	}

	// Hints are off and not computed, we need to find all hintable elements.
	const matchables: TextMatchable[] = [];
	const elements = deepGetElements(document.body, true);

	const { promise, resolve } = createPromise<void>();

	const intersectionObserver = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (
				(!viewportOnly || entry.isIntersecting) &&
				isHintable(entry.target) &&
				isVisible(entry.target)
			) {
				const normalizedTextContent = normalizeTextContent(entry.target);
				if (normalizedTextContent.length === 0) continue;

				matchables.push({
					element: entry.target,
					normalizedTextContent: normalizeTextContent(entry.target),
				});
			}
		}

		resolve();
	});

	for (const element of elements) {
		intersectionObserver.observe(element);
	}

	await promise;
	return matchables;
}

function createPromise<T>() {
	let resolve_!: (value: T | PromiseLike<T>) => void;
	const promise = new Promise<T>((resolve) => {
		resolve_ = resolve;
	});
	return { promise, resolve: resolve_ };
}

function normalizeTextContent(element: Element) {
	return getTextContent(element)
		.replaceAll(/[^a-zA-Z\s]/g, "")
		.replaceAll(/\s+/g, " ")
		.trim();
}

function getTextContent(element: Element) {
	if (element instanceof HTMLSelectElement) {
		return element.selectedOptions[0]?.textContent ?? "";
	}

	const labels =
		"labels" in element
			? (element.labels as NodeListOf<HTMLLabelElement>)
			: undefined;

	const labelText = labels
		? [...labels].map((label) => label.textContent ?? "").join(" ")
		: "";

	return (element.textContent ?? "") + " " + labelText;
}
