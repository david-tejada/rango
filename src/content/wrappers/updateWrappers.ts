import { throttle } from "lodash";
import { clearMarkedForInclusionOrExclusion } from "../hints/customHintsEdit";
import { extraSelector, getExcludeSelectorAll } from "../hints/selectors";
import {
	getAllWrappers,
	getHintedWrappers,
	getWrappersBySelector,
} from "./wrappers";
import { refresh } from "./refresh";

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

export function updateHintablesBySelector(selector: string) {
	const wrappers = getWrappersBySelector(selector);

	for (const wrapper of wrappers) {
		wrapper?.updateIsHintable();
		wrapper?.hint?.updateColors();
	}
}

export async function refreshHints() {
	await clearMarkedForInclusionOrExclusion();
	showExtraHints = false;
	showExcludedHints = false;
	await refresh({ hintsColors: true, hintsCharacters: true, isHintable: true });
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

export async function displayMoreOrLessHints(options: {
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
	await refresh({ isHintable: true, filterIn: [selector] });
}
