import Fuse from "fuse.js";
import { RangoActionWithTargets } from "../../typings/RangoAction";
import { getSetting } from "../settings/settingsManager";
import { getToggles } from "../settings/toggles";
import { deepGetElements } from "../utils/deepGetElements";
import { isHintable } from "../utils/isHintable";
import { isVisible } from "../utils/isVisible";
import { getOrCreateWrapper } from "../wrappers/ElementWrapperClass";
import { getAllWrappers } from "../wrappers/wrappers";
import { runRangoActionWithTarget } from "./runRangoActionWithTarget";

let textMatchedElement: Element | undefined;
let shouldScrollIntoView = false;

type Hintable = {
	element: Element;
	isIntersectingViewport: boolean;
	trimmedTextContent: string;
};

function trimTextContent(element: Element) {
	return element.textContent?.replace(/\d/g, "").trim() ?? "";
}

async function getHintables() {
	// Hints are on, there will be wrappers for the hintable elements
	if (getToggles().computed || getSetting("alwaysComputeHintables")) {
		return getAllWrappers()
			.filter((wrapper) => wrapper.isHintable && isVisible(wrapper.element))
			.map((wrapper) => ({
				element: wrapper.element,
				isIntersectingViewport: wrapper.isIntersectingViewport,
				trimmedTextContent: trimTextContent(wrapper.element),
			}));
	}

	const hintables: Hintable[] = [];
	const elements = deepGetElements(document.body, true);

	let resolveIntersection: (value: unknown) => void | undefined;

	const intersectionPromise = new Promise((resolve) => {
		resolveIntersection = resolve;
	});

	const intersectionObserver = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (isHintable(entry.target) && isVisible(entry.target)) {
				hintables.push({
					element: entry.target,
					isIntersectingViewport: entry.isIntersecting,
					trimmedTextContent: trimTextContent(entry.target),
				});
			}
		}

		if (resolveIntersection) resolveIntersection(true);
	});

	for (const element of elements) {
		intersectionObserver.observe(element);
	}

	await intersectionPromise;
	return hintables;
}

export async function matchElementByText(
	text: string,
	prioritizeViewport: boolean
) {
	const hintables = await getHintables();

	const fuse = new Fuse(hintables, {
		keys: ["trimmedTextContent"],
		ignoreLocation: true,
		includeScore: true,
		threshold: 0.4,
	});

	const matches = fuse.search(text);

	const sortedMatches = prioritizeViewport
		? matches.sort((a, b) => {
				if (a.item.isIntersectingViewport && !b.item.isIntersectingViewport) {
					return -1;
				}

				if (!a.item.isIntersectingViewport && b.item.isIntersectingViewport) {
					return 1;
				}

				return a.score! - b.score!;
		  })
		: matches;

	const bestMatch = sortedMatches[0];
	if (bestMatch?.item) {
		textMatchedElement = bestMatch.item.element;
		shouldScrollIntoView = !bestMatch.item.isIntersectingViewport;
	}

	return bestMatch?.score;
}

export async function executeActionOnTextMatchedElement(
	actionType: RangoActionWithTargets["type"]
) {
	if (textMatchedElement) {
		const wrapper = getOrCreateWrapper(textMatchedElement, false);

		// If the element is outside of the viewport we need to scroll the element
		// into view in order to get the topmost element, which is the one we need
		// to click on.
		if (shouldScrollIntoView) {
			textMatchedElement.scrollIntoView({
				behavior: "instant",
				block: "center",
				inline: "center",
			});
		}

		await runRangoActionWithTarget({ type: actionType, target: [] }, [wrapper]);
	}
}
