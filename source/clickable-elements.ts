// Create a list with all the clickable elements.
// I need to have a way to know if the clickable element is currently visible

// Option 1:
// Have a set with the clickable and visible elements in it.
// Add and remove elements as they are observed

const clickableSelectors = [
	"a",
	"button",
	'*[role="button"]',
	'div[role="treeitem"] span',
];

export const visibleClickableElements: Set<Element> = new Set();

export function observeClickableElements() {
	const initialClickableElements = document.querySelectorAll(
		clickableSelectors.join(", ")
	);
	const clickableElements: Set<Element> = new Set(initialClickableElements);

	// *** INTERSECTION OBSERVER ***
	const options = {
		root: null,
		rootMargin: "0px",
		threshold: 0,
	};

	const intersectionObserver = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (entry.isIntersecting) {
				visibleClickableElements.add(entry.target);
			} else {
				visibleClickableElements.delete(entry.target);
			}
		}
	}, options);

	// We observe all the initial clickable elements to see if they enter or exit
	// the viewport
	for (const clickableElement of clickableElements) {
		intersectionObserver.observe(clickableElement);
	}

	// *** MUTATION OBSERVER ***

	const config = { attributes: true, childList: true, subtree: true };

	// Every time that is a mutation event we update the list of clickable elements
	// We measure the time elapsed to avoid doing this too often
	let timeLastUpdate = Date.now();

	const mutationObserver = new MutationObserver(() => {
		const millisecondsSinceLastUpdate = Date.now() - timeLastUpdate;
		if (millisecondsSinceLastUpdate > 500) {
			// We need to wrap this in a timeout to make sure we update the elements after the last
			// mutation events
			setTimeout(() => {
				const additionalClickableElements = document.querySelectorAll(
					clickableSelectors.join(", ")
				);
				for (const element of additionalClickableElements) {
					intersectionObserver.observe(element);
				}
			}, 500);

			timeLastUpdate = Date.now();
		}
	});

	mutationObserver.observe(document, config);
}
