import { Mutex } from "async-mutex";
import { ElementWrapper } from "../typings/ElementWrapper";
import { isHintable } from "./utils/isHintable";
import { isDisabled } from "./utils/isDisabled";
import { isVisible } from "./utils/isVisible";
import { cacheHints } from "./hints/hintsCache";
import { getUserScrollableContainer } from "./utils/getUserScrollableContainer";
import { BoundedIntersectionObserver } from "./BoundedIntersectionObserver";
import { Hint } from "./hints/Hint";
import {
	getWrapper,
	addWrapper,
	deleteWrapper,
	wrappersHinted,
	getWrappersWithin,
} from "./wrappers";
import { deepGetElements } from "./utils/deepGetElements";
import { getPointerTarget } from "./utils/getPointerTarget";
import { focusesOnclick } from "./utils/focusesOnclick";
import { openInNewTab } from "./actions/openInNewTab";
import { dispatchClick, dispatchHover } from "./utils/dispatchEvents";
import {
	getExtraHintsToggle,
	updatePositionAll,
	updateShouldBeHintedAll,
	updateStyleAll,
} from "./updateWrappers";
import { matchesCustomExclude, matchesCustomInclude } from "./hints/selectors";
import { throttle } from "../lib/debounceAndThrottle";
import { cacheLayout } from "./hints/layoutCache";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getWrapperProxy(element: Element) {
	let wrapper = getWrapper(element);
	if (!wrapper) {
		wrapper = new Wrapper(element);
		addWrapper(wrapper);
	}

	return wrapper;
}

export function addWrappersFrom(root: Element) {
	// Sometimes an element gets stored and then replaced when you hit
	// the back button. For example, in GitHub. We need to delete the hints
	// that were stored with the body or another element.
	const staleHints = deepGetElements(root, true, ".rango-hint-wrapper");

	for (const hint of staleHints) {
		hint.remove();
	}

	const elements = deepGetElements(root);
	const rest = elements.splice(25_000);

	for (const element of rest) initialIntersectionObserver.observe(element);

	for (const element of elements) {
		addWrapper(new Wrapper(element));
		if (element.shadowRoot) {
			mutationObserver.observe(element.shadowRoot, mutationObserverConfig);
		} else if (element.tagName.includes("-")) {
			// If a shadow gets attached to an element after we have added that
			// wrapper the elements within that shadowRoot won't register. This seems
			// to deal with the problem.
			setTimeout(() => {
				if (element.shadowRoot) {
					const shadowElements = deepGetElements(element);
					mutationObserver.observe(element.shadowRoot, mutationObserverConfig);
					for (const element of shadowElements) {
						addWrapper(new Wrapper(element));
					}
				}
			}, 1000);
		}
	}
}

const intersectQueue: Set<Wrapper> = new Set();

const processIntersectQueue = throttle(() => {
	console.log({});
	for (const wrapper of intersectQueue) {
		wrapper.intersect(true);
		intersectQueue.delete(wrapper);
	}
}, 300);

function addToIntersectQueue(wrapper: Wrapper) {
	intersectQueue.add(wrapper);
	processIntersectQueue();
}

function removeFromIntersectQueue(wrapper: Wrapper) {
	intersectQueue.delete(wrapper);
}

// =============================================================================
// OBSERVERS
// =============================================================================

const initialIntersectionObserver = new IntersectionObserver(
	(entries, observer) => {
		for (const entry of entries) {
			if (entry.isIntersecting) {
				addWrapper(new Wrapper(entry.target));
				if (entry.target.shadowRoot) {
					mutationObserver.observe(
						entry.target.shadowRoot,
						mutationObserverConfig
					);
				} else if (entry.target.tagName.includes("-")) {
					// If a shadow gets attached to an element after we have added that
					// wrapper the elements within that shadowRoot won't register. This seems
					// to deal with the problem.
					setTimeout(() => {
						if (entry.target.shadowRoot) {
							const shadowElements = deepGetElements(entry.target);
							mutationObserver.observe(
								entry.target.shadowRoot,
								mutationObserverConfig
							);
							for (const element of shadowElements) {
								addWrapper(new Wrapper(element));
							}
						}
					}, 1000);
				}

				observer.unobserve(entry.target);
			}
		}
	},
	{
		root: document,
		rootMargin: "2000px",
		threshold: 0,
	}
);

// INTERSECTION OBSERVER

const scrollIntersectionObservers: Map<
	Element | Document,
	BoundedIntersectionObserver
> = new Map();

const mutex = new Mutex();

async function intersectionCallback(entries: IntersectionObserverEntry[]) {
	// Since this callback can be called multiple times asynchronously we need
	// to make sure that we only run the code inside after the previous one has
	// finished executing. If not the hints cache can get messed up.
	await mutex.runExclusive(async () => {
		const intersecting = entries.filter((entry) => entry.isIntersecting);

		const amountIntersecting = intersecting.length;

		const amountNotIntersectingViewport = entries.filter(
			(entry) =>
				entry.isIntersecting &&
				getWrapperProxy(entry.target).isIntersectingViewport === false
		).length;

		if (amountIntersecting) {
			await cacheHints(
				amountIntersecting - amountNotIntersectingViewport,
				amountNotIntersectingViewport
			);

			cacheLayout(intersecting.map((entry) => entry.target));
		}

		for (const entry of entries) {
			getWrapperProxy(entry.target).intersect(entry.isIntersecting);
			// const wrapper = getWrapperProxy(entry.target);
			// if (entry.isIntersecting) {
			// 	addToIntersectQueue(wrapper);
			// } else if (intersectQueue.has(wrapper)) {
			// 	removeFromIntersectQueue(wrapper);
			// } else {
			// 	wrapper.intersect(entry.isIntersecting);
			// }
		}
	});
}

const viewportIntersectionObserver = new IntersectionObserver(
	async (entries) => {
		for (const entry of entries) {
			getWrapper(entry.target)?.intersectViewport(entry.isIntersecting);
		}
	},
	{
		root: null,
		rootMargin: "0px",
		threshold: 0,
	}
);

// MUTATION OBSERVER

const mutationObserverConfig = {
	attributes: true,
	childList: true,
	subtree: true,
};

const selectorFilter =
	":not(head, head *, .rango-hint-wrapper, .rango-hint, #rango-copy-paste-area)";

const mutationCallback: MutationCallback = (mutationList) => {
	let stylesMightHaveChanged = false;

	for (const mutationRecord of mutationList) {
		for (const node of mutationRecord.addedNodes) {
			if (node instanceof Element && node.matches(selectorFilter)) {
				addWrappersFrom(node);
			}
		}

		for (const node of mutationRecord.removedNodes) {
			if (node instanceof Element && node.matches(selectorFilter)) {
				deleteWrapper(node);
			}
		}

		if (
			mutationRecord.attributeName &&
			mutationRecord.target instanceof Element &&
			mutationRecord.target.matches(selectorFilter)
		) {
			stylesMightHaveChanged = true;

			// We need to check if the element has changed its isHintable status
			if (
				["role", "contenteditable", "disabled", "aria-hidden"].includes(
					mutationRecord.attributeName
				)
			) {
				getWrapperProxy(mutationRecord.target).updateIsHintable();
			}

			if (mutationRecord.attributeName === "aria-hidden") {
				const wrappers = getWrappersWithin(mutationRecord.target);

				for (const wrapper of wrappers) {
					wrapper.updateIsHintable();
				}
			}
		}
	}

	updatePositionAll();

	if (stylesMightHaveChanged) {
		window.requestIdleCallback(() => {
			updateStyleAll();
			updateShouldBeHintedAll();
		});
	}
};

export const mutationObserver = new MutationObserver(mutationCallback);

// RESIZE OBSERVER

const hintContainerResizeObserver = new ResizeObserver(() => {
	updatePositionAll();
});

const hintablesResizeObserver = new ResizeObserver((entries) => {
	for (const entry of entries) {
		if (entry.target.isConnected) {
			getWrapperProxy(entry.target).updateShouldBeHinted();
		}
	}
});

// =============================================================================
// ELEMENT WRAPPER
// =============================================================================

export class Wrapper implements ElementWrapper {
	readonly element: Element;

	isIntersecting?: boolean;
	intersectionTimeout?: ReturnType<typeof setTimeout>;
	observingIntersection?: boolean;
	isIntersectingViewport?: boolean;
	isHintable: boolean;
	isActiveFocusable: boolean;
	shouldBeHinted?: boolean;
	updateShouldBeHintedNextIntersection?: boolean;

	// These properties are only needed for hintables
	intersectionObserver?: BoundedIntersectionObserver;
	userScrollableContainer?: HTMLElement;
	effectiveBackgroundColor?: string;
	hint?: Hint;

	constructor(element: Element) {
		this.element = element;
		this.isActiveFocusable =
			focusesOnclick(this.element) && this.element === document.activeElement;
		this.updateIsHintable();
	}

	updateIsHintable() {
		this.isHintable = isHintable(this.element);
		if (this.isHintable) {
			if (focusesOnclick(this.element)) {
				this.element.addEventListener("focus", () => {
					this.isActiveFocusable = true;
					this.updateShouldBeHinted();
				});
				this.element.addEventListener("blur", () => {
					this.isActiveFocusable = false;
					this.updateShouldBeHinted();
				});
			}

			hintablesResizeObserver.observe(this.element);
		}

		this.updateShouldBeHinted();
	}

	updateShouldBeHinted() {
		if (this.shouldBeHinted !== undefined && !this.isIntersecting) {
			this.updateShouldBeHintedNextIntersection = true;
			return;
		}

		const newShouldBeHinted =
			this.isHintable &&
			!this.isActiveFocusable &&
			(isVisible(this.element) ||
				(matchesCustomInclude(this.element) &&
					!matchesCustomExclude(this.element)) ||
				getExtraHintsToggle()) &&
			!isDisabled(this.element);

		if (newShouldBeHinted !== this.shouldBeHinted) {
			if (newShouldBeHinted) {
				// We don't call this.observeIntersection() yet because when that
				// intersection occurs we need to know if the element is intersecting
				// the viewport for hint strings caching
				viewportIntersectionObserver.observe(this.element);
			} else {
				if (this.hint?.string) {
					wrappersHinted.delete(this.hint.string);
					this.hint.release();
				}

				viewportIntersectionObserver.unobserve(this.element);
				this.unobserveIntersection();
			}
		}

		this.shouldBeHinted = newShouldBeHinted;
	}

	observeIntersection() {
		this.userScrollableContainer = getUserScrollableContainer(this.element);

		const root =
			this.userScrollableContainer === document.documentElement ||
			this.userScrollableContainer === document.body ||
			!this.userScrollableContainer
				? document
				: this.userScrollableContainer;

		const options: IntersectionObserverInit = {
			root,
			rootMargin: "1000px",
			threshold: 0,
		};

		this.intersectionObserver =
			scrollIntersectionObservers.get(root) ??
			new BoundedIntersectionObserver(intersectionCallback, options);

		this.intersectionObserver.observe(this.element);
		this.observingIntersection = true;

		if (!scrollIntersectionObservers.has(root)) {
			scrollIntersectionObservers.set(root, this.intersectionObserver);
		}
	}

	unobserveIntersection() {
		this.intersectionObserver?.unobserve(this.element);
		this.observingIntersection = false;
	}

	intersect(isIntersecting: boolean) {
		// if (isIntersecting) console.log("intersect:", this.element);
		this.isIntersecting = isIntersecting;
		if (this.isIntersecting && this.updateShouldBeHintedNextIntersection) {
			this.updateShouldBeHinted();
			this.updateShouldBeHintedNextIntersection = false;
		}

		if (this.isIntersecting && this.shouldBeHinted) {
			this.hint ??= new Hint(this.element);
			const containerToObserve =
				this.hint.container instanceof HTMLElement
					? this.hint.container
					: this.hint.container.host;
			hintContainerResizeObserver.observe(containerToObserve);
			const hintString = this.hint.claim();
			if (hintString) wrappersHinted.set(hintString, this);
		} else if (this.hint?.string) {
			wrappersHinted.delete(this.hint.string);
			this.hint.release();
		}
	}

	intersectViewport(isIntersecting: boolean) {
		this.isIntersectingViewport = isIntersecting;

		// Only after having stored isIntersectingViewport we can start observing
		// the intersection for the element so when intersectionCallback is called
		// we already know how many are intersecting the viewport to cache those
		// hint strings as optional.
		if (!this.intersectionObserver) this.observeIntersection();

		if (this.isIntersectingViewport && !this.observingIntersection) {
			// If it was previously unobserved because the hint was reclaimed, we will
			// get an intersection entry for intersectionObserver.
			this.intersectionObserver?.observe(this.element);
			this.observingIntersection = true;
		}
	}

	click() {
		const pointerTarget = getPointerTarget(this.element);
		this.hint?.flash();

		if (pointerTarget instanceof HTMLElement && focusesOnclick(pointerTarget)) {
			pointerTarget.focus();
		} else if (pointerTarget instanceof HTMLAnchorElement) {
			// In Firefox if we click a link with target="_blank" we get a popup message
			// saying "Firefox prevented this site from opening a popup". In order to
			// avoid that we open a new tab with the url of the href of the link.
			// Sometimes websites use links with target="_blank" but don't open a new tab.
			// They probably prevent the default behavior with javascript. For example Slack
			// has this for opening a thread in the side panel. So here we make sure that
			// there is a href attribute before we open the link in a new tab.
			if (
				pointerTarget.getAttribute("target") === "_blank" &&
				pointerTarget.getAttribute("href")
			) {
				void openInNewTab([this]);
			} else {
				void dispatchClick(pointerTarget);
			}
		} else {
			void dispatchClick(pointerTarget);
		}
	}

	hover() {
		const pointerTarget = getPointerTarget(this.element);
		this.hint?.flash();
		dispatchHover(pointerTarget);

		// We need to return the pointerTarget to add to the list of hoveredElements
		// so that later we can unhover all hovered elements
		return pointerTarget;
	}

	remove() {
		this.unobserveIntersection();
		viewportIntersectionObserver.unobserve(this.element);
		this.shouldBeHinted = undefined;
		this.isIntersectingViewport = undefined;

		if (this.hint?.string) {
			this.hint.release();
		}
	}
}
