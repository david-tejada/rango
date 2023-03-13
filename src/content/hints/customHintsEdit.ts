import { retrieve, store } from "../../common/storage";
import { assertDefined } from "../../typings/TypingUtils";

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

export async function storeCustomSelectors() {
	const pattern = getHostPattern();

	const customSelectors = await retrieve("customSelectors");

	assertDefined(customSelectors);

	const customForPattern = customSelectors[pattern] ?? {
		include: [],
		exclude: [],
	};

	const addedSelectors = [...includeSelectors, ...excludeSelectors];

	customForPattern.include = [
		...new Set([...customForPattern.include, ...includeSelectors]),
	];
	customForPattern.exclude = [
		...new Set([...customForPattern.exclude, ...excludeSelectors]),
	];

	includeSelectors = [];
	excludeSelectors = [];

	customSelectors[pattern] = customForPattern;

	await store("customSelectors", customSelectors);

	return addedSelectors;
}

export async function resetCustomSelectors() {
	const pattern = getHostPattern();

	const customSelectors = await retrieve("customSelectors");

	assertDefined(customSelectors);

	const customForPattern = customSelectors[pattern];

	const toUpdateSelector = customForPattern
		? [...customForPattern.include, ...customForPattern.exclude].join(", ")
		: "";

	customSelectors[pattern] = { include: [], exclude: [] };

	await store("customSelectors", customSelectors);

	return toUpdateSelector;
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
