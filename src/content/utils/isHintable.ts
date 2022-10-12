import { getElementsFromOrigin } from "./getElementsFromOrigin";

const clickableSelector =
	// Elements
	"button, a, input, summary, textarea, select, option, label, " +
	// Roles
	"[role='button'], [role='link'], [role='treeitem'], [role='tab'], [role='option'], " +
	"[role='radio'], [role='checkbox'], [role='menuitem'], [role='menuitemradio'], " +
	// Attributes
	"[contenteditable='true'], [contenteditable='']";

/**
 * It matches every div, li, h1, h2, h3, h4, h5 or h6 that has the word button
 * in its class
 */
const buttonClassSelector =
	"[class*='button' i]:not([class*='buttons' i]):not(:not(div, li, h1, h2, h3, h4, h5, h6))";

// Maximum distance between an element and it's descendent to be considered
// a redundant clickable element
const OVERLAP_THRESHOLD = 10;

function isRedundant(target: Element) {
	const descendantClickables = getElementsFromOrigin(target, false).filter(
		(element) => isClickable(element)
	);

	for (const descendant of descendantClickables) {
		const elementRect = target.getBoundingClientRect();
		const descendantRect = descendant.getBoundingClientRect();
		if (
			// We have to ignore descendants that aren't visible, for example, an
			// <option> inside a <select>
			descendantRect.width !== 0 &&
			descendantRect.height !== 0 &&
			Math.abs(descendantRect.x - elementRect.x) < OVERLAP_THRESHOLD &&
			Math.abs(descendantRect.y - elementRect.y) < OVERLAP_THRESHOLD
		) {
			return true;
		}
	}

	return false;
}

function isClickable(target: Element): boolean {
	if (
		target.matches(clickableSelector) ||
		(target instanceof HTMLElement && target.onclick !== null)
	) {
		return true;
	}

	const { cursor } = window.getComputedStyle(target);

	if (target.matches("[role='toolbar'] > *") && cursor === "pointer") {
		return true;
	}

	return false;
}

// Returns true if the element is the first element with "cursor: pointer"
// that is not a child of a clickable element and its first child element is
// not a clickable element
function isFirstCursorPointer(target: Element): boolean {
	return Boolean(
		window.getComputedStyle(target).cursor === "pointer" &&
			target.parentElement &&
			window.getComputedStyle(target.parentElement).cursor !== "pointer" &&
			!isClickable(target.parentElement) &&
			!(target.firstElementChild && isClickable(target.firstElementChild))
	);
}

function isInnermostClassButton(target: Element): boolean {
	if (
		!target.matches(buttonClassSelector) ||
		target.querySelector(buttonClassSelector)
	) {
		return false;
	}

	// Here we ensure that the element or any ascendant with the word "button" in
	// it's class isn't a child of clickable element
	let current: Element | null = target.parentElement;

	while (current) {
		if (isClickable(current)) {
			return false;
		}

		if (!current.matches("[class*='button' i]")) {
			return true;
		}

		current = current.parentElement;
	}

	return true;
}

export function isHintable(target: Element): boolean {
	if (isClickable(target)) {
		return !isRedundant(target);
	}

	if (
		isFirstCursorPointer(target) &&
		!target.querySelector(buttonClassSelector)
	) {
		return !isRedundant(target);
	}

	if (isInnermostClassButton(target)) {
		return !isRedundant(target);
	}

	return false;
}
