import { ElementWrapper } from "../typings/ElementWrapper";
import { deepGetElements } from "./utils/deepGetElements";

export const wrappersAll: Map<Element, ElementWrapper> = new Map();
export const wrappersHinted: Map<string, ElementWrapper> = new Map();

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
		result = [];
		for (const string of wrappersHinted.keys()) {
			if (key.includes(string)) {
				result.push(wrappersHinted.get(string)!);
			}
		}
	}

	return result;
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

export function deleteWrapper(target: Element) {
	const elements = deepGetElements(target);
	for (const element of elements) {
		const wrapper = wrappersAll.get(element);

		if (wrapper?.hint?.string) wrappersHinted.delete(wrapper.hint.string);

		wrapper?.remove();

		wrappersAll.delete(element);
	}
}

export function clearWrappersAll() {
	for (const wrapper of wrappersAll.values()) {
		wrapper?.remove();
	}

	wrappersAll.clear();
	wrappersHinted.clear();
}
