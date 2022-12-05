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
	displayExtraHints,
	updatePositionAll,
	updateShouldBeHintedAll,
	updateStyleAll,
} from "./updateWrappers";

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

	for (const element of elements) {
		addWrapper(new Wrapper(element));
		if (element.shadowRoot) {
			mutationObserver.observe(element.shadowRoot, mutationObserverConfig);
		}
	}
}

// =============================================================================
// OBSERVERS
// =============================================================================

// INTERSECTION OBSERVER

export const scrollIntersectionObservers: Map<
	Element | null,
	BoundedIntersectionObserver
> = new Map();

export async function intersectionCallback(
	entries: IntersectionObserverEntry[]
) {
	const amountIntersecting = entries.filter(
		(entry) => entry.isIntersecting
	).length;

	if (amountIntersecting) {
		await cacheHints(amountIntersecting);
	}

	for (const entry of entries) {
		getWrapperProxy(entry.target).intersect(entry.isIntersecting);
	}
}

// MUTATION OBSERVER

export const mutationObserverConfig = {
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
				["role", "contenteditable", "disabled"].includes(
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
		updateStyleAll();
		updateShouldBeHintedAll();
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
	isHintable: boolean;
	isActiveFocusable: boolean;
	shouldBeHinted?: boolean;

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
		this.isHintable = isHintable(this.element, displayExtraHints());
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
			isVisible(this.element) &&
			!isDisabled(this.element);

		if (newShouldBeHinted !== this.shouldBeHinted) {
			if (newShouldBeHinted) {
				this.observeIntersection();
			} else {
				if (this.hint?.string) {
					wrappersHinted.delete(this.hint.string);
					this.hint.release();
				}

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
			rootMargin: "300px",
			threshold: 0,
		};

		this.intersectionObserver =
			scrollIntersectionObservers.get(root) ??
			new BoundedIntersectionObserver(intersectionCallback, options);

		this.intersectionObserver.observe(this.element);

		if (!scrollIntersectionObservers.has(root)) {
			scrollIntersectionObservers.set(root, this.intersectionObserver);
		}
	}

	unobserveIntersection() {
		this.intersectionObserver?.unobserve(this.element);
	}

	intersect(isIntersecting: boolean) {
		this.isIntersecting = isIntersecting;

		if (this.isIntersecting && this.shouldBeHinted) {
			this.hint ??= new Hint(this.element);
			const containerToObserve =
				this.hint.container instanceof HTMLElement
					? this.hint.container
					: this.hint.container.host;
			hintContainerResizeObserver.observe(containerToObserve);
			try {
				wrappersHinted.set(this.hint.claim(), this);
			} catch (error: unknown) {
				console.error(error);
			}
		} else if (this.hint?.string) {
			wrappersHinted.delete(this.hint.string);
			this.hint.release();
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
		this.shouldBeHinted = undefined;

		if (this.hint?.string) {
			this.hint.release();
		}
	}
}
