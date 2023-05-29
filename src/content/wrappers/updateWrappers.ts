import { throttle } from "../../lib/debounceAndThrottle";
import {
	clearMarkedForInclusionOrExclusion,
	popCustomSelectorsToUpdate,
} from "../hints/customHintsEdit";
import { clearHintsCache } from "../hints/hintsCache";
import { extraSelector, getExcludeSelectorAll } from "../hints/selectors";
import {
	getAllWrappers,
	getHintedWrappers,
	getWrappersBySelector,
} from "./wrappers";

let showExtraHints = false;
let showExcludedHints = false;

export const updateStyleAll = throttle(() => {
	for (const wrapper of getHintedWrappers()) {
		wrapper.hint?.updateColors();
	}
}, 50);

export const updatePositionAll = throttle(() => {
	for (const wrapper of getHintedWrappers()) {
		wrapper.hint?.position();
	}
}, 50);

export const updateShouldBeHintedAll = throttle(() => {
	for (const wrapper of getAllWrappers()) {
		if (wrapper.isHintable) {
			wrapper.updateShouldBeHinted();
		}
	}
}, 300);

function updateIsHintableAll() {
	for (const wrapper of getAllWrappers()) {
		wrapper.updateIsHintable();
	}
}

export function updateHintablesBySelector(selector: string) {
	const wrappers = getWrappersBySelector(selector);

	for (const wrapper of wrappers) {
		wrapper?.updateIsHintable();
		wrapper?.hint?.updateColors();
	}
}

export function updateRecentCustomSelectors() {
	const selectorToUpdate = popCustomSelectorsToUpdate();
	updateHintablesBySelector(selectorToUpdate);
}

export async function refreshHints() {
	clearMarkedForInclusionOrExclusion();
	showExtraHints = false;
	showExcludedHints = false;
	for (const wrapper of getHintedWrappers()) {
		wrapper.remove();
		wrapper.hint?.applyDefaultStyle();
	}

	await clearHintsCache();
	updateIsHintableAll();
}

export function updateHintsStyle() {
	for (const wrapper of getHintedWrappers()) {
		wrapper.hint!.applyDefaultStyle();
	}

	updatePositionAll();
}

export function getExtraHintsToggle() {
	return showExtraHints;
}

export function getShowExcludedToggle() {
	return showExcludedHints;
}

export function displayMoreOrLessHints(options: {
	extra?: boolean;
	excluded?: boolean;
}) {
	if (options.extra !== undefined) showExtraHints = options.extra;
	if (options.excluded !== undefined) showExcludedHints = options.excluded;

	// We need to update the excluded hints as this function serves to also show
	// previously excluded hints
	const excludeSelector = getExcludeSelectorAll();
	let selector = extraSelector;
	if (excludeSelector) selector = `${selector}, ${excludeSelector}`;
	updateHintablesBySelector(selector);
}
