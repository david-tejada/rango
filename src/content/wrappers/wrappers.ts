import { deepGetElements } from "../dom/deepGetElements";
import { getToggles } from "../settings/toggles";
import { type ElementWrapper } from "./ElementWrapper";

const wrappersAll = new Map<Element, ElementWrapper>();
/**
 * The wrappers showing each label. Links that point to the same place but sit
 * in different parts of the page share a label rather than taking one each, so
 * a label can be on more than one element at a time.
 */
const wrappersHinted = new Map<string, Set<ElementWrapper>>();

export function getAllWrappers() {
	return [...wrappersAll.values()];
}

export function getHintedWrappers() {
	return [...wrappersHinted.values()].flatMap((wrappers) => [...wrappers]);
}

/**
 * The wrappers sharing a label, including the one passed.
 */
export function getWrappersSharingLabel(label: string) {
	return [...(wrappersHinted.get(label) ?? [])];
}

// These methods adds the target and all of its descendants if they were
// already created
export function addWrapper(wrapper: ElementWrapper) {
	wrappersAll.set(wrapper.element, wrapper);
}

export function getWrapper(key: Element | string): ElementWrapper | undefined;
export function getWrapper(key: string[]): ElementWrapper[];
export function getWrapper(
	key: Element | string | string[]
): ElementWrapper | ElementWrapper[] | undefined {
	let result: ElementWrapper | ElementWrapper[] | undefined;

	if (key instanceof Element) {
		result = wrappersAll.get(key);
	}

	if (typeof key === "string") {
		result = pickWrapper(wrappersHinted.get(key));
	}

	if (Array.isArray(key)) {
		// The hints might be off and all hintedWrappers only exist because of
		// alwaysComputeHintables being on. In that case we make as if there weren't
		// any hinted wrappers for any given hint string.
		if (!getToggles().computed) return [];

		result = [];
		for (const string of key) {
			const wrapper = pickWrapper(wrappersHinted.get(string));
			if (wrapper) result.push(wrapper);
		}
	}

	return result;
}

// This is more performant than getWrapper
export function getWrapperForElement(element: Element) {
	return wrappersAll.get(element);
}

export function getWrappersWithin(element: Element): ElementWrapper[] {
	const result: ElementWrapper[] = [];

	for (const wrapper of wrappersAll.values()) {
		if (element.contains(wrapper.element)) {
			result.push(wrapper);
		}
	}

	return result;
}

/**
 * When several wrappers share a label, the one we act on is whichever of them
 * is on screen. They all lead to the same place, so any will do, but acting on
 * one that is out of view would scroll the page for no reason.
 */
function pickWrapper(wrappers?: Set<ElementWrapper>) {
	if (!wrappers?.size) return undefined;

	for (const wrapper of wrappers) {
		if (wrapper.isIntersectingViewport) return wrapper;
	}

	return [...wrappers][0];
}

export function setHintedWrapper(label: string, element: Element) {
	const wrapper = getWrapper(element);
	if (!wrapper) return;

	const wrappers = wrappersHinted.get(label) ?? new Set();
	forget(wrappers, element);
	wrappers.add(wrapper);
	wrappersHinted.set(label, wrappers);
}

/**
 * Removes whatever wrapper is standing for an element.
 *
 * We can't look the wrapper up and delete that, because an element can be
 * wrapped more than once over its life: a mutation puts a fresh wrapper in
 * place of the old one, and the old one would then sit here for ever.
 */
function forget(wrappers: Set<ElementWrapper>, element: Element) {
	for (const wrapper of wrappers) {
		if (wrapper.element === element) wrappers.delete(wrapper);
	}
}

/**
 * Drops the wrappers that can no longer let go of a label themselves: their
 * element has left the page, or a mutation has replaced them with a fresh
 * wrapper that knows nothing about the label they are holding. Left in place
 * they would keep a label in use for the lifetime of the page.
 */
function prune(wrappers: Set<ElementWrapper>) {
	for (const wrapper of wrappers) {
		if (
			!wrapper.element.isConnected ||
			wrappersAll.get(wrapper.element) !== wrapper
		) {
			wrappers.delete(wrapper);
		}
	}
}

/**
 * Stops showing a label on an element.
 *
 * @returns `true` if no element is showing the label any more, so it can go
 * back to the stack.
 */
export function clearHintedWrapper(label: string, element?: Element) {
	const wrappers = wrappersHinted.get(label);
	if (!wrappers) return true;

	if (element) forget(wrappers, element);
	else wrappers.clear();

	prune(wrappers);

	if (wrappers.size > 0) return false;

	wrappersHinted.delete(label);
	return true;
}

export function reclaimLabels(amount?: number) {
	const reclaimed = [];

	for (const [label, wrappers] of wrappersHinted.entries()) {
		// A label only comes back when none of the elements showing it is in the
		// viewport, since they all answer to it.
		if ([...wrappers].some((wrapper) => wrapper.isIntersectingViewport)) {
			continue;
		}

		for (const wrapper of new Set(wrappers)) {
			wrapper.unobserveIntersection();
			wrapper.hint?.release(false);
		}

		reclaimed.push(label);
		if (amount && reclaimed.length >= amount) return reclaimed;
	}

	return reclaimed;
}

export function deleteWrapper(target: Element) {
	const elements = deepGetElements(target);
	for (const element of elements) {
		const wrapper = wrappersAll.get(element);

		if (wrapper?.hint?.label) {
			clearHintedWrapper(wrapper.hint.label, element);
		}

		wrapper?.suspend();

		wrappersAll.delete(element);
	}
}

export function clearWrappersAll() {
	for (const wrapper of wrappersAll.values()) {
		wrapper?.suspend();
	}

	wrappersAll.clear();
	wrappersHinted.clear();
}

export function hideHintsAll() {
	for (const wrapper of getHintedWrappers()) {
		wrapper.hint?.hide();
	}
}

export function showHintsAll() {
	for (const wrapper of getHintedWrappers()) {
		wrapper.hint?.show();
	}
}
