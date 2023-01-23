import { ElementWrapper } from "../typings/ElementWrapper";
import { isHintable } from "./utils/isHintable";
import { isDisabled } from "./utils/isDisabled";
import { isVisible } from "./utils/isVisible";
import { cacheHints } from "./hints/hintsCache";
import { getUserScrollableContainer } from "./utils/getUserScrollableContainer";
import { BoundedIntersectionObserver } from "./BoundedIntersectionObserver";
import { Hint } from "./hints/Hint";
import {
	addWrapper,
	deleteWrapper,
	getWrappersWithin,
	getWrapperForElement,
	clearHintedWrapper,
} from "./wrappers";
import { deepGetElements } from "./utils/deepGetElements";
import { getPointerTarget } from "./utils/getPointerTarget";
import { focusesOnclick } from "./utils/focusesOnclick";
import { openInNewTab } from "./actions/openInNewTab";
import {
	dispatchClick,
	dispatchHover,
	dispatchUnhover,
} from "./utils/dispatchEvents";
import {
	getExtraHintsToggle,
	updatePositionAll,
	updateShouldBeHintedAll,
	updateStyleAll,
} from "./updateWrappers";
import { matchesCustomExclude, matchesCustomInclude } from "./hints/selectors";
import { cacheLayout, clearLayoutCache } from "./hints/layoutCache";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getOrCreateWrapper(element: Element) {
	let wrapper = getWrapperForElement(element);
	if (!wrapper) {
		wrapper = new Wrapper(element);
		addWrapper(wrapper);
	}

	return wrapper;
}

function addWrapperOrShadow(element: Element) {
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

export function addWrappersFrom(root: Element) {
	// Sometimes an element gets stored and then replaced when you hit
	// the back button. For example, in GitHub. We need to delete the hints
	// that were stored with the body or another element.
	const staleHints = deepGetElements(root, true, ".rango-hint");

	for (const hint of staleHints) {
		hint.remove();
	}

	// We must include all elements here (except Rango hints) and not just
	// hintables because we need to check for elements that could have a shadow
	// root attached that could contain hintables
	const elements = deepGetElements(root, true);

	if (elements.length > 25_000) {
		for (const element of elements) {
			addWrapperIntersectionObserver.observe(element);
		}
	} else {
		cacheLayout(
			elements.filter((element) => isHintable(element)),
			false
		);
		for (const element of elements) {
			addWrapperOrShadow(element);
		}

		clearLayoutCache();
	}
}

// =============================================================================
// OBSERVERS
// =============================================================================

// ADD WRAPPER INTERSECTION OBSERVER

// This is only used in very large pages. The reason being that creating
// wrappers for hundreds of thousands of elements all at once can be costly. For
// example, https://html.spec.whatwg.org/ has circa 288.000 elements. Using this
// observer we create only wrappers for the elements that are in the viewport +
// rootMargin.
export const addWrapperIntersectionObserver = new IntersectionObserver(
	(entries) => {
		cacheLayout(
			entries
				.filter((entry) => entry.isIntersecting)
				.filter((entry) => isHintable(entry.target))
				.map((entry) => entry.target),
			false
		);
		for (const entry of entries) {
			const wrapper = getWrapperForElement(entry.target);
			if (!wrapper && entry.isIntersecting) {
				addWrapperOrShadow(entry.target);
			} else if (!entry.isIntersecting) {
				getWrapperForElement(entry.target)?.remove();
			}
		}
	},
	{
		root: document,
		rootMargin: "1000px",
		threshold: 0,
	}
);

// INTERSECTION OBSERVER

const scrollIntersectionObservers: Map<
	Element | null,
	BoundedIntersectionObserver
> = new Map();

async function intersectionCallback(entries: IntersectionObserverEntry[]) {
	// Since this callback can be called multiple times asynchronously we need
	// to make sure that we only run the code inside after the previous one has
	// finished executing. If not the hints cache can get messed up.
	const amountIntersecting = entries.filter(
		(entry) => entry.isIntersecting
	).length;

	const amountNotIntersectingViewport = entries.filter(
		(entry) =>
			entry.isIntersecting &&
			getOrCreateWrapper(entry.target).isIntersectingViewport === false
	).length;

	if (amountIntersecting) {
		await cacheHints(
			amountIntersecting - amountNotIntersectingViewport,
			amountNotIntersectingViewport
		);
	}

	for (const entry of entries) {
		getOrCreateWrapper(entry.target).intersect(entry.isIntersecting);
	}
}

const viewportIntersectionObserver = new IntersectionObserver(
	async (entries) => {
		for (const entry of entries) {
			getWrapperForElement(entry.target)?.intersectViewport(
				entry.isIntersecting
			);
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
	":not(head, head *, .rango-hint, #rango-copy-paste-area)";

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
				getOrCreateWrapper(mutationRecord.target).updateIsHintable();
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
		updateStyleAll();
		updateShouldBeHintedAll();
	}
};

export const mutationObserver = new MutationObserver(mutationCallback);

// RESIZE OBSERVER

const hintablesResizeObserver = new ResizeObserver((entries) => {
	for (const entry of entries) {
		if (entry.target.isConnected) {
			getOrCreateWrapper(entry.target).updateShouldBeHinted();
		}
	}
});

// =============================================================================
// ELEMENT WRAPPER
// =============================================================================

export interface Wrapper extends ElementWrapper {}

export class Wrapper {
	constructor(element: Element) {
		this.element = element;
		this.isActiveFocusable =
			this.element === document.activeElement && focusesOnclick(this.element);
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
					clearHintedWrapper(this.hint.string);
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
				? null
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
		this.isIntersecting = isIntersecting;

		if (this.isIntersecting && this.shouldBeHinted) {
			this.hint ??= new Hint(this.element);
			this.hint.claim();
		} else if (this.hint?.string) {
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

		if (
			pointerTarget instanceof HTMLAnchorElement &&
			pointerTarget.getAttribute("target") === "_blank" &&
			pointerTarget.getAttribute("href")
		) {
			// In Firefox if we click a link with target="_blank" we get a popup message
			// saying "Firefox prevented this site from opening a popup". In order to
			// avoid that we open a new tab with the url of the href of the link.
			// Sometimes websites use links with target="_blank" but don't open a new tab.
			// They probably prevent the default behavior with javascript. For example Slack
			// has this for opening a thread in the side panel. So here we make sure that
			// there is a href attribute before we open the link in a new tab.
			void openInNewTab([this]);
		} else {
			// Some pages expect a some hover event prior to the click and if there
			// isn't one we can't click at all. For example, Slack search suggestions.
			dispatchHover(pointerTarget);
			void dispatchClick(pointerTarget);
		}
	}

	hover() {
		const pointerTarget = getPointerTarget(this.element);
		this.hint?.flash();
		dispatchHover(pointerTarget);
	}

	unhover() {
		const pointerTarget = getPointerTarget(this.element);
		dispatchUnhover(pointerTarget);
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
