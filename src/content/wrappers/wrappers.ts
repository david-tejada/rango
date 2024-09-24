import { type ElementWrapper } from "../../typings/ElementWrapper";
import { getToggles } from "../settings/toggles";
import { deepGetElements } from "../utils/deepGetElements";

const wrappersAll = new Map<Element, ElementWrapper>();
const wrappersHinted = new Map<string, ElementWrapper>();

export function getAllWrappers() {
	return [...wrappersAll.values()];
}

export function getHintedWrappers() {
	return [...wrappersHinted.values()];
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
		result = wrappersHinted.get(key);
	}

	if (Array.isArray(key)) {
		// The hints might be off and all hintedWrappers only exist because of
		// alwaysComputeHintables being on. In that case we make as if there weren't
		// any hinted wrappers for any given hint string.
		if (!getToggles().computed) return [];

		result = [];
		for (const string of key) {
			if (wrappersHinted.has(string)) {
				result.push(wrappersHinted.get(string)!);
			}
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

export function setHintedWrapper(hint: string, element: Element) {
	const wrapper = getWrapper(element);
	if (wrapper) wrappersHinted.set(hint, wrapper);
}

export function clearHintedWrapper(hint: string) {
	wrappersHinted.delete(hint);
}

export function reclaimHints(amount?: number) {
	const reclaimed = [];

	for (const [hintString, wrapper] of wrappersHinted.entries()) {
		if (!wrapper.isIntersectingViewport) {
			wrapper.unobserveIntersection();
			wrapper.hint?.release(false);
			reclaimed.push(hintString);
			if (amount && reclaimed.length >= amount) return reclaimed;
		}
	}

	return reclaimed;
}

export function deleteWrapper(target: Element) {
	const elements = deepGetElements(target);
	for (const element of elements) {
		const wrapper = wrappersAll.get(element);

		if (wrapper?.hint?.string) wrappersHinted.delete(wrapper.hint.string);

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
	for (const wrapper of wrappersHinted.values()) {
		wrapper?.hint?.hide();
	}
}

export function showHintsAll() {
	for (const wrapper of wrappersHinted.values()) {
		wrapper?.hint?.show();
	}
}
