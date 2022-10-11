import { debounce } from "../lib/debounceAndThrottle";
import { createsStackingContext } from "./utils/createsStackingContext";
import { isHintable } from "./utils/isHintable";
import { isDisabled } from "./utils/isDisabled";
import { isVisible } from "./utils/isVisible";
import { getElementsFromOrigin } from "./utils/getElementsFromOrigin";
import { cacheHints } from "./hints/hintsCache";
import { getScrollContainer } from "./utils/getScrollContainer";
import { BoundedIntersectionObserver } from "./BoundedIntersectionObserver";
import { Hint } from "./Hint";

// *** OBSERVERS ***

// *** INTERSECTION OBSERVER ***

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

// *** MUTATION OBSERVER ***

const mutationObserverConfig = {
	attributes: true,
	childList: true,
	subtree: true,
};

const filterSelector = ":not(head, head *, .rango-hint-wrapper, .rango-hint)";

const mutationCallback: MutationCallback = (mutationList) => {
	const addedElements: Set<Element> = new Set();
	const removedElements: Set<Element> = new Set();
	const movedElements: Set<Element> = new Set();
	let stylesMightHaveChanged = false;

	for (const mutationRecord of mutationList) {
		for (const node of mutationRecord.addedNodes) {
			/**
			 * When an element is moved from one parent to another we get a mutation
			 * event with an entry with the elements in removedNodes and another one
			 * with the	element in addedNodes. The issue here is that we don't get
			 * any intersection event, so if we remove the element first from hintables
			 * and then we add it again we are not gonna get any intersection and the
			 * hint won't be created. Here we cancel out element that have been both
			 * added and deleted.
			 */
			if (node instanceof Element && node.matches(filterSelector)) {
				if (removedElements.has(node)) {
					removedElements.delete(node);
					movedElements.add(node);
				} else {
					addedElements.add(node);
				}
			}
		}

		for (const node of mutationRecord.removedNodes) {
			if (node instanceof Element && node.matches(filterSelector)) {
				removedElements.add(node);
			}
		}

		if (
			mutationRecord.attributeName &&
			mutationRecord.target instanceof Element &&
			mutationRecord.target.matches(filterSelector)
		) {
			stylesMightHaveChanged = true;

			// We need to check if the element has changed its isHintable status
			if (
				["role", "contenteditable", "jsaction", "disabled"].includes(
					mutationRecord.attributeName
				)
			) {
				getWrapper(mutationRecord.target).updateIsHintable();
				getWrapper(mutationRecord.target).updateShouldBeHinted();
			}
		}
	}

	for (const element of addedElements) {
		addWrapper(element);
	}

	for (const element of removedElements) {
		deleteWrapper(element);
	}

	for (const element of movedElements) {
		getWrapper(element).elementWasMoved();
	}

	if (stylesMightHaveChanged) {
		updateStyleAll();
		updateShouldBeHintedAll();
	}
};

export const mutationObserver = new MutationObserver(mutationCallback);

// *** RESIZE OBSERVER ***

const hintContainerResizeObserver = new ResizeObserver((entries) => {
	for (const entry of entries) {
		positionHintsInContainer(entry.target);
	}
});

const hintablesResizeObserver = new ResizeObserver((entries) => {
	for (const entry of entries) {
		getWrapper(entry.target).updateShouldBeHinted();
	}
});

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

		if (wrapper?.hint?.string) {
			wrappersHinted.delete(wrapper.hint.string);
			wrapper.hint.release();
		}

		wrappersAll.delete(element);
	}
}

function updateStyleAll() {
	for (const wrapper of wrappersHinted.values()) {
		wrapper.hint?.updateColors();
	}
}

const updateShouldBeHintedAll = debounce(() => {
	for (const wrapper of wrappersAll.values()) {
		if (wrapper.isHintable) {
			wrapper.updateShouldBeHinted();
		}
	}
}, 50);

function positionHintsInContainer(container: Element) {
	const hints: NodeListOf<HTMLDivElement> = container.querySelectorAll(
		":scope > .rango-hint-wrapper > .rango-hint"
	);

	const strings = [...hints].map((hint) => hint.dataset["hint"]) as string[];
	const wrappers = getWrapper(strings);

	for (const wrapper of wrappers) {
		wrapper.hint?.position();
	}
}

export class ElementWrapper {
	readonly element: Element;
	readonly topmost: Element;

	isIntersecting: boolean;
	isHintable: boolean;
	shouldBeHinted: boolean;

	// These properties are only needed for hintables
	intersectionObserver?: BoundedIntersectionObserver;
	scrollContainer?: HTMLElement | null;
	effectiveBackgroundColor?: string;
	hint?: Hint;

	// Stacking contexts
	createsStackingContext: boolean;
	parentStackingContext?: ElementWrapper;
	childrenStackingContexts?: Set<ElementWrapper>;

	constructor(element: Element) {
		this.element = element;

		// Get topmost element
		const { x, y } = element.getBoundingClientRect();
		const elementsAtPoint = document.elementsFromPoint(x + 5, y + 5);

		for (const elementAt of elementsAtPoint) {
			if (elementAt === element || element.contains(elementAt)) {
				this.topmost = elementAt;
				break;
			}
		}

		this.topmost ??= this.element;

		this.isIntersecting = false;

		this.isHintable = isHintable(this.element);

		if (this.isHintable) {
			hintablesResizeObserver.observe(this.element);
		}

		this.shouldBeHinted =
			this.isHintable && isVisible(this.element) && !isDisabled(this.element);

		if (this.shouldBeHinted) {
			this.observeIntersection();
		}

		this.createsStackingContext = createsStackingContext(element);

		if (this.createsStackingContext) {
			this.parentStackingContext = this.getParentStackingContext();

			if (this.createsStackingContext) {
				this.childrenStackingContexts = new Set();
				this.parentStackingContext?.childrenStackingContexts?.add(this);
			}
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
					this.hint.release();
				}

				this.unobserveIntersection();
			}
		}

		this.shouldBeHinted = newShouldBeHinted;
	}

	observeIntersection() {
		this.scrollContainer = getScrollContainer(this.element);

		const root =
			this.scrollContainer === document.documentElement ||
			this.scrollContainer === document.body ||
			!this.scrollContainer
				? null
				: this.scrollContainer;

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
			this.hint ??= new Hint(this.topmost);
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

	getParentStackingContext(): ElementWrapper | undefined {
		let current = this.getParent();
		while (current) {
			if (current.createsStackingContext) {
				return current;
			}

			current = current.getParent();
		}

		return undefined;
	}

	recomputeStackingContext(isStackingContext: boolean) {
		this.createsStackingContext = isStackingContext;

		if (isStackingContext) {
			this.childrenStackingContexts = new Set();
			const parentStackingContext = this.getParentStackingContext();
			if (parentStackingContext?.childrenStackingContexts) {
				for (const childrenStackingContext of parentStackingContext.childrenStackingContexts) {
					if (this.element.contains(childrenStackingContext.element)) {
						this.childrenStackingContexts.add(childrenStackingContext);
						parentStackingContext.childrenStackingContexts.delete(
							childrenStackingContext
						);
					}
				}
			}
		}
	}

	elementWasMoved() {
		this.scrollContainer = getScrollContainer(this.element);

		if (this.hint?.string) {
			this.hint.release();
		}

		// if (this.createsStackingContext) {
		// 	if (this.childrenStackingContexts) {
		// 		for (const child of this.childrenStackingContexts) {
		// 			this.parentStackingContext?.childrenStackingContexts?.add(child);
		// 			this.childrenStackingContexts.delete(child);
		// 		}
		// 	}

		// 	this.parentStackingContext = undefined;
		// }
	}
}
