import Fuse from "fuse.js";
import { deepGetElements } from "../dom/deepGetElements";
import { isHintable } from "../dom/isHintable";
import { isVisible } from "../dom/isVisible";
import { getSetting } from "../settings/settingsManager";
import { getToggles } from "../settings/toggles";
import { getAllWrappers } from "../wrappers/wrappers";

type TextMatchable = {
	element: Element;
	isIntersectingViewport: boolean;
	normalizedTextContent: string;
};

const textMatchedElements = new Map<string, Element>();

export async function matchElementByText(
	text: string,
	prioritizeViewport: boolean
) {
	const matchableElements = await getTextMatchableElements();

	const fuse = new Fuse(matchableElements, {
		keys: ["normalizedTextContent"],
		ignoreLocation: true,
		includeScore: true,
		threshold: 0.4,
	});

	const matches = fuse.search(text);

	if (matches.length === 0) return;

	if (prioritizeViewport) {
		matches.sort((a, b) => {
			const viewportIntersectionComparison =
				Number(b.item.isIntersectingViewport) -
				Number(a.item.isIntersectingViewport);
			return viewportIntersectionComparison;
		});
	}

	const bestMatch = matches[0]!;
	textMatchedElements.set(text, bestMatch.item.element);

	return bestMatch.score;
}

export function getTextMatchedElement(text: string) {
	const match = textMatchedElements.get(text);
	textMatchedElements.delete(text);
	return match;
}

function normalizeTextContent(element: Element) {
	return (element.textContent ?? "")
		.replaceAll(/[^a-zA-Z\s]/g, "")
		.replaceAll(/\s+/g, " ")
		.trim();
}

async function getTextMatchableElements() {
	// Hints are on or alwaysComputeHintables is on. There will be wrappers for
	// the hintable elements.
	if (getToggles().computed || getSetting("alwaysComputeHintables")) {
		return getAllWrappers()
			.filter((wrapper) => wrapper.isHintable && isVisible(wrapper.element))
			.map((wrapper) => ({
				element: wrapper.element,
				isIntersectingViewport: wrapper.isIntersectingViewport,
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
			if (isHintable(entry.target) && isVisible(entry.target)) {
				const normalizedTextContent = normalizeTextContent(entry.target);
				if (normalizedTextContent.length === 0) continue;

				matchables.push({
					element: entry.target,
					isIntersectingViewport: entry.isIntersecting,
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
