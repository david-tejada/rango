import { Intersector } from "../types/types";
import {
	getClickableType,
	isVisible,
	hasTextNodesChildren,
} from "../lib/dom-utils";
import { displayHints } from "./hints";

export const intersectors: Intersector[] = [];

// *** INTERSECTION OBSERVER ***
const options = {
	root: null,
	rootMargin: "0px",
	threshold: 0,
};

export const intersectionObserver = new IntersectionObserver(
	async (entries) => {
		for (const entry of entries) {
			if (entry.isIntersecting) {
				onIntersection(entry.target, true);
			} else {
				onIntersection(entry.target, false);
			}
		}

		await displayHints(intersectors);
	},
	options
);

// We observe all the initial elements before any mutation
if (document.readyState === "complete") {
	addIntersector(document.body);
	displayHints(intersectors).catch((error) => {
		console.log(error);
	});
} else {
	window.addEventListener("load", () => {
		addIntersector(document.body);
		displayHints(intersectors).catch((error) => {
			console.log(error);
		});
	});
}

// *** MUTATION OBSERVER ***

const config = { attributes: true, childList: true, subtree: true };
const mutationObserver = new MutationObserver(async (mutationList) => {
	let updateHints = false;
	for (const mutationRecord of mutationList) {
		if (mutationRecord.type === "childList") {
			for (const node of mutationRecord.addedNodes as NodeListOf<Node>) {
				if (
					node.nodeType === 1 &&
					!(node as Element).id.includes("rango-hints-container") &&
					!(node as Element).parentElement?.id.includes("rango-hints-container")
				) {
					addIntersector(node as Element);
					updateHints = true;
				}
			}
			// We don't care too much about removed nodes. I think it's going to be more expensive
			// to remove them from our list of our observed elements than to do nothing
		}

		if (mutationRecord.type === "attributes") {
			const hintsContainer = document.querySelector("#rango-hints-container");
			if (!hintsContainer?.contains(mutationRecord.target)) {
				onAttributeMutation(mutationRecord.target as Element);
				updateHints = true;
			}
		}
	}

	if (updateHints) {
		await displayHints(intersectors);
	}
});

// We observe document instead of document.body in case the body gets replaced
mutationObserver.observe(document, config);

function addIntersector(element: Element) {
	const elementAndDescendants = [element, ...element.querySelectorAll("*")];
	for (const elementToAdd of elementAndDescendants) {
		const clickableType = getClickableType(elementToAdd);
		if (clickableType || hasTextNodesChildren(elementToAdd)) {
			intersectionObserver.observe(elementToAdd);
		}
	}
}

function getIntersector(element: Element): Intersector | undefined {
	return intersectors.find((Intersector) => Intersector.element === element);
}

function removeIntersector(element: Element) {
	const intersectorIndex = intersectors.findIndex(
		(Intersector) => Intersector.element === element
	);
	if (intersectorIndex > -1) {
		intersectors.splice(intersectorIndex, 1);
	}
}

function onIntersection(element: Element, isIntersecting: boolean): void {
	if (isIntersecting) {
		intersectors.push({
			element,
			isVisible: isVisible(element),
			clickableType: getClickableType(element),
		});
	} else {
		removeIntersector(element);
	}
}

function onAttributeMutation(element: Element) {
	const intersector = getIntersector(element);
	if (intersector) {
		intersector.isVisible = isVisible(element);
		intersector.clickableType = getClickableType(element);
	}

	for (const descendant of element.querySelectorAll("*")) {
		const observedDescendantElement = getIntersector(descendant);
		if (observedDescendantElement) {
			observedDescendantElement.isVisible = isVisible(descendant);
		}
	}
}
