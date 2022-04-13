import { ObservedElement, ClickableType } from "./types";

export const observedElements: ObservedElement[] = [];

// *** INTERSECTION OBSERVER ***
const options = {
	root: null,
	rootMargin: "0px",
	threshold: 0,
};

export const intersectionObserver = new IntersectionObserver((entries) => {
	for (const entry of entries) {
		if (entry.isIntersecting) {
			onIntersection(entry.target, true);
		} else {
			onIntersection(entry.target, false);
		}
	}
}, options);

// We observe all the initial elements before any mutation
if (document.readyState === "complete") {
	addObservedElement(document.body);
} else {
	window.addEventListener("load", () => {
		addObservedElement(document.body);
	});
}

// *** MUTATION OBSERVER ***

const config = { attributes: true, childList: true, subtree: true };
const mutationObserver = new MutationObserver((mutationList) => {
	for (const mutationRecord of mutationList) {
		if (mutationRecord.type === "childList") {
			for (const node of mutationRecord.addedNodes as NodeListOf<Node>) {
				if (node.nodeType === 1) {
					addObservedElement(node as Element);
				}
			}
			// We don't care too much about removed nodes. I think it's going to be more expensive
			// to remove them from our list of our observed elements than to do nothing
		}

		if (mutationRecord.type === "attributes") {
			onAttributeMutation(mutationRecord.target as Element);
		}
	}
});

// We observe document instead of document.body in case the body gets replaced
mutationObserver.observe(document, config);

// This function is here mostly for debugging purposes
function getClickableType(element: Element): ClickableType {
	const clickableTags = ["BUTTON", "A", "INPUT", "SUMMARY"];
	const clickableRoles = ["button", "link", "treeitem", "tab"];
	const elementTag = element.tagName;
	const elementRole = element.getAttribute("role");

	if (clickableTags.includes(elementTag)) {
		return elementTag.toLowerCase() as ClickableType;
	}

	if (elementRole && clickableRoles.includes(elementRole)) {
		return elementRole as ClickableType;
	}

	if ((element as HTMLElement).onclick !== null) {
		return "onclick";
	}

	return undefined;
}

function isVisible(element: Element): boolean {
	const rect = element.getBoundingClientRect();
	return (
		window.getComputedStyle(element).visibility !== "hidden" &&
		window.getComputedStyle(element).display !== "none" &&
		Number.parseFloat(window.getComputedStyle(element).opacity) > 0.1 &&
		rect.width + rect.height > 10
	);
}

function addObservedElement(element: Element) {
	// For now we observe all the elements, in the future we might want to select which ones we observe
	const elementAndDescendants = [element, ...element.querySelectorAll("*")];
	for (const elementToAdd of elementAndDescendants) {
		intersectionObserver.observe(elementToAdd);
		observedElements.push({
			element: elementToAdd,
			isIntersecting: undefined,
			isVisible: isVisible(elementToAdd),
			clickableType: getClickableType(elementToAdd),
		});
	}
}

function getObservedElement(element: Element): ObservedElement | undefined {
	return observedElements.find(
		(ObservedElement) => ObservedElement.element === element
	);
}

function onIntersection(element: Element, isIntersecting: boolean): void {
	const observedElement = getObservedElement(element);

	// We should always have a match but just to be extra sure we check it
	if (observedElement) {
		observedElement.isIntersecting = isIntersecting;
		observedElement.isVisible = isVisible(element);
	}
}

function onAttributeMutation(element: Element) {
	const observedElement = getObservedElement(element);
	if (observedElement) {
		observedElement.isVisible = isVisible(element);
		observedElement.clickableType = getClickableType(element);
	}

	for (const descendant of element.querySelectorAll("*")) {
		const observedDescendantElement = getObservedElement(descendant);
		if (observedDescendantElement) {
			observedDescendantElement.isVisible = isVisible(descendant);
		}
	}
}
