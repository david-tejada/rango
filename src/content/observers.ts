import { isClickable } from "./utils/isClickable";
import { onIntersection, onAttributeMutation } from "./intersectors";
import { hintables } from "./hints/hintables";
import { Hintable } from "./Hintable";
import { cacheHints } from "./hints/hintsCache";
import { maybeAddScrollContainer } from "./utils/getScrollContainer";

// *** INTERSECTION OBSERVER ***

const intersectionObservers: Map<Element, IntersectionObserver> = new Map();

const options = {
	root: null,
	rootMargin: "300px",
	threshold: 0,
};

async function intersectionCallback(entries: IntersectionObserverEntry[]) {
	console.log(entries);
	const amountIntersecting = entries.filter(
		(entry) => entry.isIntersecting
	).length;

	await cacheHints(amountIntersecting);

	for (const entry of entries) {
		onIntersection(entry.target, entry.isIntersecting);
	}
}

const rootIntersectionObserver = new IntersectionObserver(
	intersectionCallback,
	options
);

// *** MUTATION OBSERVER ***

const mutationCallback: MutationCallback = (mutationList) => {
	for (const mutationRecord of mutationList) {
		if (mutationRecord.type === "childList") {
			for (const node of mutationRecord.addedNodes) {
				if (
					node instanceof Element &&
					!node.classList.contains("rango-hints-container") &&
					!node.classList.contains("rango-hint")
				) {
					maybeObserveIntersection(node);
				}
			}

			for (const node of mutationRecord.removedNodes) {
				if (node instanceof Element && hintables.has(node)) {
					hintables.delete(node);
				}
			}
		}

		if (
			mutationRecord.type === "attributes" &&
			mutationRecord.target instanceof Element &&
			!mutationRecord.target.classList.contains("rango-hints-container") &&
			!mutationRecord.target.classList.contains("rango-hint")
		) {
			onAttributeMutation(mutationRecord.target);
		}
	}
};

const config = { attributes: true, childList: true, subtree: true };
const mutationObserver = new MutationObserver(mutationCallback);

function maybeObserveIntersection(element: Element) {
	let descendants = element.querySelectorAll("*");
	if (element.shadowRoot) {
		// We need to create a new mutation observer for each shadow root because
		// the main mutation observer doesn't register changes in those
		const mutationObserver = new MutationObserver(mutationCallback);
		mutationObserver.observe(element.shadowRoot, config);
		descendants = element.shadowRoot.querySelectorAll("*");
	}

	const elements = [element, ...descendants];

	const shadowOutputs = [...descendants].filter(
		(element) => element.shadowRoot
	);
	for (const shadowOutput of shadowOutputs) {
		maybeObserveIntersection(shadowOutput);
	}

	for (const element of elements) {
		// Since every element is gonna be examined here at least once this is a good
		// place to check if the element is a scroll container
		maybeAddScrollContainer(element);

		// For the moment with just add clickable elements. When I implement cursorless
		// hats I might need to also add element with hasTextNodesChildren(element)
		if (isClickable(element)) {
			const hintable = new Hintable(element);
			const scrollContainer = hintable.scrollContainer;
			// console.debug(scrollContainer, hintable);

			if (scrollContainer) {
				const intersectionObserver = intersectionObservers.has(scrollContainer)
					? intersectionObservers.get(scrollContainer)
					: new IntersectionObserver(intersectionCallback, {
							root:
								scrollContainer === document.documentElement ||
								scrollContainer === document.body
									? null
									: scrollContainer,
							rootMargin: "300px",
							threshold: 0,
					  });

				// This check is here to please the linter
				if (intersectionObserver) {
					intersectionObservers.set(scrollContainer, intersectionObserver);
					intersectionObserver.observe(element);
				}
			} else {
				rootIntersectionObserver.observe(element);
			}

			hintables.set(element, hintable);
		}
	}
}

export default function observe() {
	// We observe all the initial elements before any mutation
	maybeObserveIntersection(document.body);

	// We observe document instead of document.body in case the body gets replaced
	mutationObserver.observe(document, config);
}
