import {
	getExtraHintsToggle,
	getShowExcludedToggle,
} from "../hints/customHints/customHints";
import { matchesStagedSelector } from "../hints/customHints/customSelectorsStaging";
import {
	matchesCustomExclude,
	matchesCustomInclude,
	matchesExtraSelector,
	matchesHintableSelector,
} from "../hints/selectors";
import { isVisible } from "./isVisible";

/**
 * Returns true if the element has any Element siblings (that are not hints) or
 * any Text sibling with content. For performance reasons if the element has
 * more than 9 siblings of any kind it will return true.
 */
function hasSignificantSiblings(target: Node) {
	if (!target.parentNode) return false;

	// This is to improve performance in case the parent has many child nodes. In
	// that case we can safely assume the element has significant siblings.
	if (target.parentNode.childNodes.length > 10) return true;

	return [...target.parentNode.childNodes].some(
		(node) =>
			node !== target &&
			// We need to exclude hint divs for when we display/remove extra hints
			((node instanceof Element && node.className !== "rango-hint") ||
				(node instanceof Text &&
					node.textContent &&
					/\S/.test(node.textContent)))
	);
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

	// This catches instances of hintables that are wrapped within another
	// hintable. For example a <div role="button"> that only contains a <button>.
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
	const { cursor } = getComputedStyle(target);

	if (
		(cursor === "pointer" ||
			cursor === "text" ||
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
	// Issue 264
	if (document.location.href === "https://pad.cogneon.io/static/empty.html") {
		return false;
	}

	if (
		getExtraHintsToggle() &&
		(matchesHintableSelector(target) || isHintableExtra(target))
	) {
		return true;
	}

	if (matchesCustomInclude(target)) return true;

	if (matchesCustomExclude(target) && !getShowExcludedToggle()) return false;

	return (
		(matchesHintableSelector(target) && !isRedundant(target)) ||
		matchesStagedSelector(target, true)
	);
}
