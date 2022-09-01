import { isClickable } from "./utils/isClickable";
import { onIntersection, onAttributeMutation } from "./intersectors";
import { hintables } from "./hints/hintables";
import { Hintable } from "./Hintable";
import { cacheHints } from "./hints/hintsCache";
import { createsStackingContext } from "./utils/createsStackingContext";
import { getStackContainer, stackContainers } from "./utils/getStackContainer";
import { Hint } from "./hints/Hint";

// *** INTERSECTION OBSERVER ***

const intersectionObservers: Map<Element, IntersectionObserver> = new Map();

const options = {
	root: null,
	rootMargin: "300px",
	threshold: 0,
};

async function intersectionCallback(entries: IntersectionObserverEntry[]) {
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

// *** RESIZE OBSERVER ***
export const resizeObserver = new ResizeObserver((entries) => {
	for (const entry of entries) {
		console.log(entry);
	}
	// for (const hintable of hintables.getAll({
	// 	clickable: true,
	// })) {
	// 	hintable.update();
	// }
});

// *** MUTATION OBSERVER ***

const mutationCallback: MutationCallback = (mutationList) => {
	const addedNodes = new Set();
	const deleteNodes = new Set();
	for (const mutationRecord of mutationList) {
		if (mutationRecord.type === "childList") {
			for (const node of mutationRecord.addedNodes) {
				// When an element is moved from one parent to another we get a mutation event
				// with an entry with the elements in removedNodes and another one with the
				// element in addedNodes. The issue here is that we don't get any intersection
				// event, so if we remove the element first from hintables and then we add it
				// again we are not gonna get any intersection and the hint won't be created.
				// Here we cancel out element that have been both added and deleted.
				if (deleteNodes.has(node)) {
					deleteNodes.delete(node);
				} else {
					addedNodes.add(node);
				}
			}

			for (const node of mutationRecord.removedNodes) {
				deleteNodes.add(node);
			}
		}

		if (
			mutationRecord.type === "attributes" &&
			mutationRecord.target instanceof Element &&
			!mutationRecord.target.classList.contains("rango-hint-wrapper") &&
			!mutationRecord.target.classList.contains("rango-hint")
		) {
			// if (
			// 	!stackContainers.has(mutationRecord.target) &&
			// 	createsStackingContext(mutationRecord.target)
			// ) {
			// 	const elements = mutationRecord.target.querySelectorAll("*");
			// 	for (const element of elements) {
			// 		const hintable = hintables.get(element);

			// 		// We make sure that if the element was already in the stacking context we don't do anything
			// 		if (
			// 			hintable &&
			// 			(!hintable.hint ||
			// 				!mutationRecord.target.contains(hintable.hint.element))
			// 		) {
			// 			// Todo: Instead of removing and adding the hint it would be better to just
			// 			// move it to the new destination
			// 			hintable.stackContainer = getStackContainer(hintable.element);
			// 			hintable.hint?.remove(true);
			// 			hintable.hint = undefined;
			// 			hintable.hint = new Hint(element, hintable.stackContainer);
			// 		}
			// 	}
			// }

			onAttributeMutation(mutationRecord.target);
		}
	}

	for (const node of addedNodes) {
		if (
			node instanceof Element &&
			!node.classList.contains("rango-hints-container") &&
			!node.classList.contains("rango-hint")
		) {
			maybeObserveIntersection(node);
		}
	}

	for (const node of deleteNodes) {
		const descendants =
			node instanceof HTMLElement ? node.querySelectorAll("*") : [];
		const elements = [node, ...descendants];
		for (const element of elements) {
			if (element instanceof Element && hintables.has(element)) {
				hintables.delete(element);
			}
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
		// We need to reposition hints when elements change size
		// resizeObserver.observe(element);
		const style = window.getComputedStyle(element);
		if (style.transitionDuration !== "0s" || style.transitionDelay !== "0s") {
			console.log("Transition element:", element);
			element.addEventListener("transitionend", () => {
				window.requestAnimationFrame(() => {
					console.log("hintables update");
					hintables.updateTree(element);
				});
			});
		}

		// For the moment we just add clickable elements. When I implement cursorless
		// hats I might need to also add element with hasTextNodesChildren(element)
		if (isClickable(element)) {
			const hintable = new Hintable(element);

			const scrollContainer = hintable.scrollContainer;

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
