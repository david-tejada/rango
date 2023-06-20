import browser from "webextension-polyfill";
import { CustomSelectorsForPattern } from "../../typings/StorageSchema";
import { retrieve } from "../../common/storage";

export interface SelectorAlternative {
	selector: string;
	specificity: number;
	elementsMatching: number;
}

let includeSelectors: string[] = [];
let excludeSelectors: string[] = [];
let selectorAlternatives: SelectorAlternative[] = [];
let lastSelectorAlternativeUsed = -1;
let lastModeUsed: "include" | "exclude";
let selectorsToUpdate: string[] = [];

function getHostPattern() {
	if (window.location.protocol.includes("http")) {
		return `https?://${window.location.host}/*`;
	}

	return window.location.href;
}

async function getCustomSelectorsAll() {
	const pattern = getHostPattern();
	const customSelectors = await retrieve("customSelectors");
	const customForPattern = customSelectors.get(pattern);

	if (!customForPattern) return [];

	const { include, exclude } = customForPattern;

	return [...include, ...exclude];
}

export function updateSelectorAlternatives(
	alternatives: SelectorAlternative[]
) {
	selectorAlternatives = alternatives;
}

export function pickSelectorAlternative(options: {
	mode?: "include" | "exclude";
	step?: 1 | -1;
}) {
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

	if (removed) selectorsToUpdate.push(removed);

	if (index < 0) {
		lastSelectorAlternativeUsed = -1;
		return;
	}

	const selector = selectorAlternatives[index]!.selector;

	if (mode === "include") {
		includeSelectors.push(selector);
	} else {
		excludeSelectors.push(selector);
	}

	selectorsToUpdate.push(selector);
}

/**
 * Stores the custom selectors for the URL pattern of the current frame. To
 * avoid multiple frames changing the custom selectors at the same time a
 * message is sent to the background script where that is handled safely.
 *
 * @returns An array with the selectors that were added
 */
export async function confirmSelectorsCustomization() {
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

	return customSelectorsAdded;
}

/**
 * Resets the custom selectors for the URL pattern of the current frame. To
 * avoid multiple frames changing the custom selectors at the same time a
 * message is sent to the background script where that is handled safely.
 *
 * @returns An array with the selectors that were removed
 */
export async function resetCustomSelectors() {
	const pattern = getHostPattern();
	const customSelectorsBefore = await getCustomSelectorsAll();

	await browser.runtime.sendMessage({
		type: "resetCustomSelectors",
		pattern,
	});

	return customSelectorsBefore;
}

// I had to create this function to avoid dependency cycle if I were to import
// some function from the updateWrappers module. This function is called from
// the updateWrappers module instead.
export function popCustomSelectorsToUpdate() {
	const result = selectorsToUpdate.join(", ");
	selectorsToUpdate = [];

	return result;
}

export function clearMarkedForInclusionOrExclusion() {
	includeSelectors = [];
	excludeSelectors = [];
	selectorAlternatives = [];
	lastSelectorAlternativeUsed = -1;
}

export function matchesMarkedForInclusion(target: Element) {
	for (const selector of includeSelectors) {
		if (target.matches(selector)) return true;
	}

	return false;
}

export function matchesMarkedForExclusion(target: Element) {
	for (const selector of excludeSelectors) {
		if (target.matches(selector)) return true;
	}

	return false;
}
