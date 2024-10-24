import { debounce } from "lodash";
import { type ElementWrapper } from "../../typings/ElementWrapper";
import { type Hint } from "../../typings/Hint";
import { getExtraHintsToggle } from "../actions/customHints";
import { HintClass } from "../hints/HintClass";
import { cacheHints } from "../hints/hintsCache";
import { cacheLayout, clearLayoutCache } from "../hints/layoutCache";
import { matchesCustomExclude, matchesCustomInclude } from "../hints/selectors";
import { setStyleProperties } from "../hints/setStyleProperties";
import { sendMessage } from "../messaging/contentMessageBroker";
import { getSetting } from "../settings/settingsManager";
import { BoundedIntersectionObserver } from "../utils/BoundedIntersectionObserver";
import { deepGetElements } from "../utils/deepGetElements";
import {
	dispatchClick,
	dispatchHover,
	dispatchUnhover,
} from "../utils/dispatchEvents";
import { isEditable } from "../utils/domUtils";
import { getPointerTarget } from "../utils/getPointerTarget";
import { getUserScrollableContainer } from "../utils/getUserScrollableContainer";
import { isDisabled } from "../utils/isDisabled";
import { isHintable } from "../utils/isHintable";
import { isVisible } from "../utils/isVisible";
import { refresh } from "./refresh";
import {
	addWrapper,
	clearHintedWrapper,
	deleteWrapper,
	getWrapperForElement,
	getWrappersWithin,
} from "./wrappers";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Retrieve the ElementWrapper for a given element. If the wrapper doesn't exist
 * it creates one.
 *
 * @param element The element to retrieve or create the wrapper
 * @param active Set to false to avoid displaying a hint for the created
 * ElementWrapper. Useful for when we only need a temporary wrapper to use with
 * references while the hints are off.
 * @returns  The ElementWrapper for the element
 */
export function getOrCreateWrapper(element: Element, active = true) {
	let wrapper = getWrapperForElement(element);
	if (!wrapper) {
		wrapper = new ElementWrapperClass(element, active);
		if (active) {
			addWrapper(wrapper);
		}
	}

	return wrapper;
}

function addWrapperOrShadow(element: Element) {
	addWrapper(new ElementWrapperClass(element));
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
					addWrapper(new ElementWrapperClass(element));
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
			addWrappersIntersectionObserver.observe(element);
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

// ADD WRAPPERS INTERSECTION OBSERVER

/**
 * Intersection Observer that handles adding wrappers for elements that are
 * within the viewport + `rootMargin` and remove those that aren't. The reason
 * for this is that creating and iterating through wrappers for hundreds of
 * thousands of elements can be very detrimental for performance. For example,
 * https://html.spec.whatwg.org/ has circa 288.000 elements. This Intersection
 * Observer is only supposed to be used in those very large pages.
 */
const addWrappersIntersectionObserver = new IntersectionObserver(
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
				getWrapperForElement(entry.target)?.suspend();
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

const scrollIntersectionObservers = new Map<
	Element | null,
	BoundedIntersectionObserver
>();

async function intersectionCallback(entries: IntersectionObserverEntry[]) {
	const entriesIntersecting = entries.filter((entry) => entry.isIntersecting);
	const amountIntersecting = entriesIntersecting.length;

	const entriesNotIntersecting = entries.filter(
		(entry) => !entry.isIntersecting
	);

	// We process first the entries not intersecting so the hints can be released.
	for (const entry of entriesNotIntersecting) {
		getOrCreateWrapper(entry.target).intersect(entry.isIntersecting);
	}

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

	for (const entry of entriesIntersecting) {
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

const elementsToSkip = "head, head *, .rango-hint, #rango-toast";

function isNonRangoMutation(mutation: MutationRecord) {
	const isRangoMutation =
		mutation.attributeName === "data-hint" ||
		(mutation.addedNodes.length === 1 &&
			mutation.addedNodes[0]! instanceof Element &&
			mutation.addedNodes[0].className === "rango-hint") ||
		(mutation.removedNodes.length === 1 &&
			mutation.removedNodes[0]! instanceof Element &&
			mutation.removedNodes[0].className === "rango-hint");

	return !isRangoMutation;
}

const mutationCallback: MutationCallback = async (mutationList) => {
	const nonRangoMutations = mutationList.filter((mutation) =>
		isNonRangoMutation(mutation)
	);

	if (nonRangoMutations.length === 0) return;

	let stylesMightHaveChanged = false;

	for (const mutationRecord of mutationList) {
		for (const node of mutationRecord.addedNodes) {
			if (node instanceof Element && !node.matches(elementsToSkip)) {
				addWrappersFrom(node);
			}
		}

		for (const node of mutationRecord.removedNodes) {
			if (node instanceof Element && !node.matches(elementsToSkip)) {
				deleteWrapper(node);
			}
		}

		if (
			mutationRecord.attributeName &&
			mutationRecord.target instanceof Element &&
			!mutationRecord.target.matches(elementsToSkip)
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

	await refresh({
		hintsPosition: true,
		hintsColors: stylesMightHaveChanged,
		shouldBeHinted: stylesMightHaveChanged,
	});
};

export const mutationObserver = new MutationObserver(mutationCallback);

// RESIZE OBSERVER

/**
 * Recompute if an element should be hinted when there is a resize event. The
 * change in `shouldBeHinted` state is mostly due to the element going from or to
 * `display: none`.
 */
const hintablesResizeObserver = new ResizeObserver((entries) => {
	for (const entry of entries) {
		if (entry.target.isConnected) {
			getOrCreateWrapper(entry.target).updateShouldBeHinted();
		}
	}
});

export function disconnectObservers() {
	addWrappersIntersectionObserver.disconnect();
	mutationObserver.disconnect();
	viewportIntersectionObserver.disconnect();
	hintablesResizeObserver.disconnect();

	for (const observer of scrollIntersectionObservers.values()) {
		observer.disconnect();
	}
}

// FOCUS CHANGE
// Some elements could become visible after some other element is focused. For
// example, using `:focus-within ul { opacity: 1 }` the `ul` could become
// visible after focusing a sibling label.
// Example: https://v3.daisyui.com/components/dropdown/#method-2-using-label-and-css-focus
const debouncedHandleFocusChange = debounce(async () => {
	await refresh({ shouldBeHinted: true });
}, 100);

// Using `focusin` and `focusout` here since `focus` and `blur` don't bubble.
document.addEventListener("focusin", debouncedHandleFocusChange);
document.addEventListener("focusout", debouncedHandleFocusChange);

// =============================================================================
// WRAPPER CLASS
// =============================================================================

/**
 * A wrapper for a DOM Element.
 */
class ElementWrapperClass implements ElementWrapper {
	isIntersecting?: boolean;
	observingIntersection?: boolean;
	isIntersectingViewport?: boolean;
	isActiveEditable: boolean;
	isHintable!: boolean;
	shouldBeHinted?: boolean;

	// These properties are only needed for hintables
	intersectionObserver?: BoundedIntersectionObserver;
	userScrollableContainer?: Element;
	effectiveBackgroundColor?: string;
	hint?: Hint;

	constructor(
		public element: Element,
		active = true
	) {
		this.isActiveEditable =
			this.element === document.activeElement && isEditable(this.element);

		if (active) {
			this.updateIsHintable();
		}
	}

	updateIsHintable() {
		this.isHintable = isHintable(this.element);

		if (this.isHintable) {
			if (isEditable(this.element)) {
				this.element.addEventListener("focus", () => {
					this.isActiveEditable = true;
					this.updateShouldBeHinted();
				});
				this.element.addEventListener("blur", () => {
					this.isActiveEditable = false;
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
			!this.isActiveEditable &&
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
			rootMargin: `${getSetting("viewportMargin")}px`,
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
			this.hint ??= new HintClass(this.element);
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

	async click(): Promise<boolean> {
		const pointerTarget = getPointerTarget(this.element);
		if (this.hint?.inner.isConnected) {
			this.hint.flash();
		} else {
			this.flashElement();
		}

		if (this.element instanceof HTMLAnchorElement) {
			const closestContentEditable = this.element.closest("[contenteditable]");
			const isWithinContentEditable =
				closestContentEditable instanceof HTMLElement &&
				closestContentEditable.isContentEditable;

			if (
				(this.element.getAttribute("target") === "_blank" ||
					isWithinContentEditable) &&
				this.element.getAttribute("href") &&
				// Issue #213: Open Discord's internal links in the same tab.
				!(
					window.location.host === "discord.com" &&
					window.location.host === new URL(this.element.href).host
				)
			) {
				// In Firefox if we click a link with target="_blank" we get a popup
				// message saying "Firefox prevented this site from opening a popup". In
				// order to avoid that we open a new tab with the url of the href of the
				// link. Sometimes websites use links with target="_blank" but don't
				// open a new tab. They probably prevent the default behavior with
				// javascript. For example Slack has this for opening a thread in the
				// side panel. So here we make sure that there is an href attribute
				// before we open the link in a new tab.
				await sendMessage("createTabs", {
					createPropertiesArray: [this].map((wrapper) => ({
						url: (wrapper.element as HTMLAnchorElement).href,
						active: true,
					})),
				});
				return false;
			}
		}

		// Some pages expect a some hover event prior to the click and if there
		// isn't one we can't click at all. For example, Slack search suggestions.
		dispatchHover(pointerTarget);
		return dispatchClick(pointerTarget);
	}

	flashElement() {
		const element = this.element;

		if (!(element instanceof HTMLElement)) {
			return;
		}

		const previousOutline = element.style.outline;

		setStyleProperties(element, {
			outline: "2px solid #0891b2",
		});
		setTimeout(() => {
			element.style.outline = previousOutline;
		}, 150);
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

	suspend() {
		this.unobserveIntersection();
		viewportIntersectionObserver.unobserve(this.element);
		hintablesResizeObserver.unobserve(this.element);
		this.shouldBeHinted = undefined;
		this.isIntersectingViewport = undefined;

		this.hint?.release();
	}
}
