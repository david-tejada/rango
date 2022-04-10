import { ObservedElement, ObservedElementConfig } from "./types";

export const observedElements: ObservedElement[] = [];

// *** INTERSECTION OBSERVER ***
const options = {
	root: null,
	rootMargin: "0px",
	threshold: 0,
};
export const intersectionObserver = new IntersectionObserver((entries) => {
	performance.mark("intersectionObserver");
	for (const entry of entries) {
		if (entry.isIntersecting) {
			updateObservedElement(entry.target, { isIntersecting: true });
		} else {
			updateObservedElement(entry.target, { isIntersecting: false });
		}
	}

	performance.measure("Intersection to update", "intersectionObserver");
}, options);

// We observe all the initial elements to see if they enter or exit the viewport
performance.mark("allElements");
const allElements = document.querySelectorAll("*");
addObservedElements([...allElements]);
performance.measure("Initial load of all elements", "allElements");

// *** MUTATION OBSERVER ***

const config = { attributes: true, childList: true, subtree: true };

const mutationObserver = new MutationObserver((mutationList) => {
	performance.mark("mutationObserver");
	const addedElements: Element[] = [];
	const removedElements: Element[] = [];
	for (const mutationRecord of mutationList) {
		if (mutationRecord.type === "childList") {
			if (mutationRecord.addedNodes.length > 0) {
				for (const node of mutationRecord.addedNodes as NodeListOf<Element>) {
					addedElements.push(node);
					const newNodes = node.querySelectorAll("*");
					addedElements.concat([...newNodes]);
				}
			}

			if (mutationRecord.removedNodes.length > 0) {
				for (const node of mutationRecord.removedNodes as NodeListOf<Element>) {
					removedElements.push(node);
				}
			}
		}

		if (mutationRecord.type === "attributes") {
			updateObservedElementAndChildren(mutationRecord.target);
		}
	}

	addObservedElements(addedElements);
	removeObservedElements(removedElements);
	performance.measure("Mutation to update", "mutationObserver");
});

mutationObserver.observe(document, config);

function isClickable(element: Element): boolean {
	return (
		element.tagName === "BUTTON" ||
		element.tagName === "A" ||
		element.tagName === "INPUT" ||
		element.getAttribute("role") === "button" ||
		element.getAttribute("role") === "link" ||
		element.getAttribute("role") === "treeitem" ||
		(element as HTMLElement).onclick !== null ||
		(element as HTMLElement).click !== null
	);
}

// We need to check for visibility whenever the node or one of its ancestors changes attributes
function isVisible(element: Element): boolean {
	return (
		window.getComputedStyle(element).visibility !== "hidden" &&
		window.getComputedStyle(element).display !== "none" &&
		Number.parseFloat(window.getComputedStyle(element).opacity) > 0.1
	);
}

function updateObservedElement(
	element: Element,
	config: ObservedElementConfig
): void {
	const match = observedElements.find(
		(observedElement) => observedElement.node === element
	);

	if (match) {
		match.hintNode = config.hintNode ?? match.hintNode;
		match.isIntersecting = config.isIntersecting ?? match.isIntersecting;
		match.isVisible = isVisible(element);
		match.isClickable = isClickable(element);
	}
}

function updateObservedElementAndChildren(element: Element) {
	updateObservedElement(element, {});
	const descendants = element.querySelectorAll("*");
	for (const descendant of descendants) {
		updateObservedElement(descendant, {});
	}
}

function addObservedElements(elements: Element[]) {
	for (const element of elements) {
		intersectionObserver.observe(element);
		observedElements.push({
			node: element,
			hintNode: undefined,
			isIntersecting: undefined,
			isVisible: isVisible(element),
			isClickable: isClickable(element),
		});
	}
}

function removeObservedElements(elements: Element[]) {
	function removeObservedElement(element: Element) {
		const matchIndex = observedElements.findIndex(
			(observedElement) => observedElement.node === element
		);
		observedElements.splice(matchIndex, 1);
	}

	for (const element of elements) {
		removeObservedElement(element);
		const descendants = element.querySelectorAll("*");
		for (const descendant of descendants) {
			removeObservedElement(descendant);
		}
	}
}
