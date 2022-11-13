import { debounce } from "../lib/debounceAndThrottle";
import { isHintable } from "./utils/isHintable";
import { isDisabled } from "./utils/isDisabled";
import { isVisible } from "./utils/isVisible";
import { getElementsFromOrigin } from "./utils/getElementsFromOrigin";
import { cacheHints } from "./hints/hintsCache";
import { getUserScrollableContainer } from "./utils/getUserScrollableContainer";
import { BoundedIntersectionObserver } from "./BoundedIntersectionObserver";
import { Hint } from "./Hint";

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
		getWrapper(entry.target).intersect(entry.isIntersecting);
	}
}

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
				addWrapper(node);
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
				getWrapper(mutationRecord.target).updateIsHintable();
				getWrapper(mutationRecord.target).updateShouldBeHinted();
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
		getWrapper(entry.target).updateShouldBeHinted();
	}
});

// =============================================================================
// WRAPPERS
// =============================================================================

const wrappersAll: Map<Element, ElementWrapper> = new Map();
const wrappersHinted: Map<string, ElementWrapper> = new Map();

// These methods adds the target and all of its descendants if they were
// already created
export function addWrapper(target: Element) {
	const elements = getElementsFromOrigin(target);

	for (const element of elements) {
		if (!element.matches("rango-hint-wrapper, rango-hint")) {
			const wrapper = wrappersAll.get(element) ?? new ElementWrapper(element);
			wrappersAll.set(element, wrapper);

			if (element.shadowRoot) {
				mutationObserver.observe(element.shadowRoot, mutationObserverConfig);
			}
		}
	}
}

export function getWrapper(key: Element | string): ElementWrapper;
export function getWrapper(key: string[]): ElementWrapper[];
export function getWrapper(
	key: Element | string | string[]
): ElementWrapper | ElementWrapper[] {
	let result: ElementWrapper | ElementWrapper[] | undefined;

	if (key instanceof Element) {
		result = wrappersAll.get(key);
	}

	if (typeof key === "string") {
		result = wrappersHinted.get(key);
	}

	if (Array.isArray(key)) {
		result = [];
		for (const string of wrappersHinted.keys()) {
			if (key.includes(string)) {
				result.push(wrappersHinted.get(string)!);
			}
		}
	}

	if (!result) {
		if (key instanceof Element) {
			result = new ElementWrapper(key);
		} else {
			// eslint-disable-next-line unicorn/prefer-type-error
			throw new Error("Error finding ElementWrappers");
		}
	}

	return result;
}

function deleteWrapper(target: Element) {
	const elements = getElementsFromOrigin(target);
	for (const element of elements) {
		const wrapper = wrappersAll.get(element);

		wrapper?.remove();

		if (wrapper?.hint?.string) {
			wrappersHinted.delete(wrapper.hint.string);
		}

		wrappersAll.delete(element);
	}
}

// =============================================================================
// UPDATE
// =============================================================================

const updateStyleAll = debounce(() => {
	for (const wrapper of wrappersHinted.values()) {
		wrapper.hint?.updateColors();
	}
}, 50);

const updatePositionAll = debounce(() => {
	for (const wrapper of wrappersHinted.values()) {
		wrapper.hint?.position();
	}
}, 50);

const updateShouldBeHintedAll = debounce(() => {
	for (const wrapper of wrappersAll.values()) {
		if (wrapper.isHintable) {
			wrapper.updateShouldBeHinted();
		}
	}
}, 50);

// =============================================================================
// ELEMENT WRAPPER
// =============================================================================

export class ElementWrapper {
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

	getParent(): ElementWrapper | undefined {
		const parentElement = this.element.parentElement;
		return parentElement ? wrappersAll.get(parentElement) : undefined;
	}

	remove() {
		this.unobserveIntersection();

		if (this.hint?.string) {
			this.hint.release();
		}
	}
}
