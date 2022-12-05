import { throttle } from "../lib/debounceAndThrottle";
import { clearHintsCache } from "./hints/hintsCache";
import { wrappersAll, wrappersHinted } from "./wrappers";

let includeExtraHintables = false;

export const updateStyleAll = throttle(() => {
	for (const wrapper of wrappersHinted.values()) {
		wrapper.hint?.updateColors();
	}
}, 50);

export const updatePositionAll = throttle(() => {
	for (const wrapper of wrappersHinted.values()) {
		wrapper.hint?.position();
	}
}, 50);

export const updateShouldBeHintedAll = throttle(() => {
	for (const wrapper of wrappersAll.values()) {
		if (wrapper.isHintable) {
			wrapper.updateShouldBeHinted();
		}
	}
}, 300);

function updateIsHintableAll() {
	for (const wrapper of wrappersAll.values()) {
		wrapper.updateIsHintable();
	}
}

export async function refreshHints() {
	includeExtraHintables = false;
	for (const wrapper of wrappersHinted.values()) {
		wrapper.remove();
	}

	await clearHintsCache();
	updateIsHintableAll();
}

export function updateHintsStyle() {
	for (const wrapper of wrappersHinted.values()) {
		wrapper.hint!.applyDefaultStyle();
	}
}

export function displayExtraHints() {
	return includeExtraHintables;
}

export function displayMoreHints() {
	includeExtraHintables = true;
	updateIsHintableAll();
}

export function displayLessHints() {
	includeExtraHintables = false;
	updateIsHintableAll();
}
