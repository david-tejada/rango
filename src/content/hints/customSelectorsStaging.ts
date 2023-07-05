import browser from "webextension-polyfill";
import { retrieve } from "../../common/storage";
import { ElementWrapper } from "../../typings/ElementWrapper";
import { SelectorAlternative } from "../../typings/SelectorAlternative";
import { CustomSelectorsForPattern } from "../../typings/StorageSchema";
import { getSelectorAlternatives } from "./computeCustomSelectors";
import { updateCustomSelectors } from "./selectors";

let includeSelectors: string[] = [];
let excludeSelectors: string[] = [];
let selectorAlternatives: SelectorAlternative[] = [];
let lastSelectorAlternativeUsed = -1;
let lastModeUsed: "include" | "exclude";

export function getHostPattern() {
	if (window.location.protocol.includes("http")) {
		return `https?://${window.location.host}/*`;
	}

	return window.location.href;
}

/**
 * Retrieve the saved selectors for the current host pattern.
 *
 * @returns An array with the saved "include" and "exclude" selectors for the
 * current host pattern
 */
async function getCustomSelectorsAll() {
	const pattern = getHostPattern();
	const customSelectors = await retrieve("customSelectors");
	const customForPattern = customSelectors.get(pattern);

	if (!customForPattern) return [];

	const { include, exclude } = customForPattern;

	return [...include, ...exclude];
}

/**
 * Stages the custom selectors for a given array of ElementWrappers.
 *
 * @param wrappers An array of ElementWrappers
 * @param mode "include" or "exclude"
 * @returns The selectors that have been affected
 */
export async function stageCustomSelectors(
	wrappers: ElementWrapper[],
	mode: "include" | "exclude"
) {
	const elements = wrappers.map((wrapper) => wrapper.element);

	selectorAlternatives = getSelectorAlternatives(elements);
	const selectorsToRefresh = pickSelectorAlternative({ mode });
	return selectorsToRefresh;
}

/**
 * Picks a selector alternative from the previously calculated ones. It will
 * modify the selectors in includeSelectors and excludeSelectors.
 *
 * @param options An object with optional properties `mode` and `step`
 * @returns An array with the staged and unstaged selectors
 */
export function pickSelectorAlternative(options: {
	mode?: "include" | "exclude";
	step?: 1 | -1;
}) {
	const selectorsToUpdate = new Set<string>();

	// If we are not selecting a different alternative we need to reset the
	// lastSelectorAlternativeUsed
	if (!options.step) lastSelectorAlternativeUsed = -1;

	const mode = options.mode ?? lastModeUsed;
	lastModeUsed = mode;

	const step = options.step ?? 1;
	const index = lastSelectorAlternativeUsed + step;
	lastSelectorAlternativeUsed = index;

	let removed: string | undefined;

	if (index > selectorAlternatives.length - 1) {
		lastSelectorAlternativeUsed--;
		return;
	}

	// If we are picking a different selector alternative we first need to remove
	// the last one that we included
	if (options.step !== undefined) {
		removed =
			mode === "include" ? includeSelectors.pop() : excludeSelectors.pop();
	}

	if (removed) selectorsToUpdate.add(removed);

	if (index < 0) {
		lastSelectorAlternativeUsed = -1;
		return [...selectorsToUpdate];
	}

	const selector = selectorAlternatives[index]!.selector;

	if (mode === "include") {
		includeSelectors.push(selector);
	} else {
		excludeSelectors.push(selector);
	}

	selectorsToUpdate.add(selector);

	return [...selectorsToUpdate];
}

/**
 * Stores the custom selectors for the URL pattern of the current frame. To
 * avoid multiple frames changing the custom selectors at the same time a
 * message is sent to the background script where that is handled safely.
 *
 * @returns An array with the selectors that were added
 */
export async function saveCustomSelectors() {
	const pattern = getHostPattern();
	const customSelectorsBefore = await getCustomSelectorsAll();

	const newCustomSelectors: CustomSelectorsForPattern = {
		include: includeSelectors,
		exclude: excludeSelectors,
	};

	// Even if both include and exclude are empty arrays we need to send the
	// message to the background script to handle notifications
	await browser.runtime.sendMessage({
		type: "storeCustomSelectors",
		pattern,
		selectors: newCustomSelectors,
	});

	const customSelectorsAfter = await getCustomSelectorsAll();

	includeSelectors = [];
	excludeSelectors = [];

	const customSelectorsBeforeSet = new Set(customSelectorsBefore);

	const customSelectorsAdded = customSelectorsAfter.filter(
		(selector) => !customSelectorsBeforeSet.has(selector)
	);

	await updateCustomSelectors();

	return customSelectorsAdded;
}

export async function resetStagedSelectors() {
	includeSelectors = [];
	excludeSelectors = [];
	selectorAlternatives = [];
	lastSelectorAlternativeUsed = -1;
}

export function matchesStagedSelector(target: Element, include: boolean) {
	const selectors = include ? includeSelectors : excludeSelectors;

	for (const selector of selectors) {
		if (target.matches(selector)) return true;
	}

	return false;
}
