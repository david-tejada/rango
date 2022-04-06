export const intersectingElements: Set<HTMLElement> = new Set();
export const visibleElements: Set<HTMLElement> = new Set();
export const clickableElements: Set<HTMLElement> = new Set();
export const intersectingVisibleClickableElements: Set<HTMLElement> = new Set();

console.log("Rango: Initializing visibleClickableElements");

// *** INTERSECTION OBSERVER ***
const options = {
	root: null,
	rootMargin: "0px",
	threshold: 0,
};

export const intersectionObserver = new IntersectionObserver((entries) => {
	for (const entry of entries) {
		const target = entry.target as HTMLElement;
		if (entry.isIntersecting) {
			updateElementLists(target, true);
		} else {
			updateElementLists(target, false);
		}
	}
}, options);

// We observe all the initial elements to see if they enter or exit the viewport
const allElements = document.querySelectorAll("*");
for (const element of allElements) {
	intersectionObserver.observe(element);
}

// *** MUTATION OBSERVER ***

const config = { attributes: true, childList: true, subtree: true };

// Every time there is a mutation event we observe all the elements
// We measure the time elapsed to avoid doing this too often
let timeLastUpdate = Date.now();

const mutationObserver = new MutationObserver(() => {
	const millisecondsSinceLastUpdate = Date.now() - timeLastUpdate;
	if (millisecondsSinceLastUpdate > 500) {
		// We need to wrap this in a timeout to make sure we update the elements after the last
		// mutation events
		setTimeout(() => {
			// We could just add the mutated elements and their children, but it gets a little convoluted.
			// So, for now we do it like this and keep an eye on performance
			const allElements: NodeListOf<HTMLElement> =
				document.querySelectorAll("*");
			for (const element of allElements) {
				intersectionObserver.observe(element);
			}
		}, 500);

		timeLastUpdate = Date.now();
	}
});

mutationObserver.observe(document, config);

function isClickable(element: HTMLElement): boolean {
	return (
		element.tagName === "BUTTON" ||
		element.tagName === "A" ||
		element.onclick !== null ||
		window.getComputedStyle(element).cursor === "pointer"
	);
}

function isVisible(element: HTMLElement): boolean {
	return (
		window.getComputedStyle(element).visibility !== "hidden" &&
		window.getComputedStyle(element).display !== "none"
	);
}

function updateElementLists(
	element: HTMLElement,
	isIntersecting: boolean
): void {
	if (isIntersecting) {
		intersectingElements.add(element);
	} else {
		intersectingElements.delete(element);
	}

	if (isClickable(element)) {
		clickableElements.add(element);
	} else {
		clickableElements.delete(element);
	}

	if (isVisible(element)) {
		visibleElements.add(element);
	}

	if (
		intersectingElements.has(element) &&
		visibleElements.has(element) &&
		clickableElements.has(element)
	) {
		intersectingVisibleClickableElements.add(element);
	} else {
		intersectingVisibleClickableElements.delete(element);
	}
}
