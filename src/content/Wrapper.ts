import { throttle } from "../lib/debounceAndThrottle";
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
	wrappersAll,
} from "./wrappers";
import { getElementsFromOrigin } from "./utils/getElementsFromOrigin";

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

	await cacheHints(amountIntersecting);

	for (const entry of entries) {
		getWrapper(entry.target)?.intersect(entry.isIntersecting);
	}
}

// MUTATION OBSERVER

export function addWrappersFromOrigin(origin: Element) {
	const elements = getElementsFromOrigin(origin);
	for (const element of elements) {
		addWrapper(new Wrapper(element));
		if (element.shadowRoot) {
			mutationObserver.observe(element.shadowRoot, mutationObserverConfig);
		}
	}
}

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
				addWrappersFromOrigin(node);
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
				getWrapper(mutationRecord.target)?.updateIsHintable();
				getWrapper(mutationRecord.target)?.updateShouldBeHinted();
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
			getWrapper(entry.target)?.updateShouldBeHinted();
		}
	}
});

// =============================================================================
// UPDATE
// =============================================================================

const updateStyleAll = throttle(() => {
	for (const wrapper of wrappersHinted.values()) {
		wrapper.hint?.updateColors();
	}
}, 50);

const updatePositionAll = throttle(() => {
	for (const wrapper of wrappersHinted.values()) {
		wrapper.hint?.position();
	}
}, 50);

const updateShouldBeHintedAll = throttle(() => {
	for (const wrapper of wrappersAll.values()) {
		if (wrapper.isHintable) {
			wrapper.updateShouldBeHinted();
		}
	}
}, 300);

// =============================================================================
// ELEMENT WRAPPER
// =============================================================================

export class Wrapper implements ElementWrapper {
	readonly element: Element;
	readonly clickTarget: Element;

	isIntersecting?: boolean;
	isHintable: boolean;
	shouldBeHinted: boolean;

	// These properties are only needed for hintables
	intersectionObserver?: BoundedIntersectionObserver;
	userScrollableContainer?: HTMLElement;
	effectiveBackgroundColor?: string;
	hint?: Hint;

	constructor(element: Element) {
		this.element = element;

		// Get clickTarget element
		if (
			element.matches(
				"button, a, input, summary, textarea, select, option, label"
			)
		) {
			this.clickTarget = this.element;
		} else {
			const { x, y } = element.getBoundingClientRect();
			const elementsAtPoint = document.elementsFromPoint(x + 5, y + 5);

			for (const elementAt of elementsAtPoint) {
				if (elementAt === element || element.contains(elementAt)) {
					this.clickTarget = elementAt;
					break;
				}
			}
		}

		this.clickTarget ??= this.element;

		this.isHintable = isHintable(this.element);

		if (this.isHintable) {
			hintablesResizeObserver.observe(this.element);
		}

		this.shouldBeHinted =
			this.isHintable && isVisible(this.element) && !isDisabled(this.element);

		if (this.shouldBeHinted) {
			this.observeIntersection();
		}
	}

	updateIsHintable() {
		this.isHintable = isHintable(this.element);
		if (this.isHintable) {
			hintablesResizeObserver.observe(this.element);
		}
	}

	updateShouldBeHinted() {
		const newShouldBeHinted =
			this.isHintable && isVisible(this.element) && !isDisabled(this.element);

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
			hintContainerResizeObserver.observe(this.hint.container);
			wrappersHinted.set(this.hint.claim(), this);
		} else if (this.hint?.string) {
			wrappersHinted.delete(this.hint.string);
			this.hint.release();
		}
	}

	remove() {
		this.unobserveIntersection();

		if (this.hint?.string) {
			this.hint.release();
		}
	}
}
