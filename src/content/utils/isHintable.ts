import {
	getExtraHintsToggle,
	getShowExcludedToggle,
} from "../actions/customHints";
import { matchesStagedSelector } from "../hints/customSelectorsStaging";

import {
	matchesCustomExclude,
	matchesCustomInclude,
	matchesExtraSelector,
	matchesHintableSelector,
} from "../hints/selectors";
import { isVisible } from "./isVisible";

function hasSignificantSiblings(target: Node) {
	if (!target.parentNode) return false;

	const significantSiblingsIncludingSelf = [
		...target.parentNode.childNodes,
	].filter(
		(node) =>
			// We need to exclude hint divs for when we display/remove extra hints
			(node instanceof Element && node.className !== "rango-hint-wrapper") ||
			(node instanceof Text && node.textContent && /\S/.test(node.textContent))
	);

	return significantSiblingsIncludingSelf.length > 1;
}

function isRedundant(target: Element) {
	if (matchesCustomInclude(target)) return false;

	if (
		target.parentElement &&
		target.parentElement instanceof HTMLLabelElement &&
		target.parentElement.control === target
	) {
		return false;
	}

	if (
		target.parentElement &&
		matchesHintableSelector(target.parentElement) &&
		!hasSignificantSiblings(target)
	) {
		return true;
	}

	if (
		target instanceof HTMLLabelElement &&
		target.control &&
		isVisible(target.control)
	) {
		return true;
	}

	return false;
}

export function isHintableExtra(target: Element): boolean {
	const { cursor } = window.getComputedStyle(target);

	if (
		(cursor === "pointer" ||
			target.matches(
				"[class*='button' i], [class*='btn' i], [class*='select' i], [class*='control' i], [jsaction]"
			)) &&
		matchesExtraSelector(target)
	) {
		return true;
	}

	return false;
}

export function isHintable(target: Element): boolean {
	if (
		getExtraHintsToggle() &&
		(matchesHintableSelector(target) || isHintableExtra(target))
	) {
		return true;
	}

	if (matchesCustomExclude(target) && !getShowExcludedToggle()) return false;

	if (matchesCustomInclude(target)) return true;

	return (
		(matchesHintableSelector(target) && !isRedundant(target)) ||
		matchesStagedSelector(target, true)
	);
}
