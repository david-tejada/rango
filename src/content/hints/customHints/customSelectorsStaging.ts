import { getHostPattern } from "../../../common/getHostPattern";
import { type ElementWrapper } from "../../wrappers/ElementWrapper";
import { type SelectorAlternative } from "./SelectorAlternative";
import { getSelectorAlternatives } from "./computeCustomSelectors";

let includeSelectors: string[] = [];
let excludeSelectors: string[] = [];
let selectorAlternatives: SelectorAlternative[] = [];
let lastSelectorAlternativeUsed = -1;
let lastModeUsed: "include" | "exclude";

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

export function stageExcludeUniversalSelector() {
	excludeSelectors = ["*"];
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

export async function getStagedSelectors() {
	const pattern = getHostPattern(location.href);

	return [
		...includeSelectors.map(
			(selector) =>
				({
					pattern,
					type: "include",
					selector,
				}) as const
		),
		...excludeSelectors.map(
			(selector) =>
				({
					pattern,
					type: "exclude",
					selector,
				}) as const
		),
	];
}

export function resetStagedSelectors() {
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
