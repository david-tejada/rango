import { deepGetElements } from "./deepGetElements";
import { isVisible } from "./isVisible";

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
 * in its class. It only matches the word button when it appears before a space
 * or at the end. This is to avoid matching things like "buttons" or "button-wrapper"
 */
const buttonClassSelector =
	"[class*='button ' i]:not(:not(div, li, h1, h2, h3, h4, h5, h6)),[class$='button' i]:not(:not(div, li, h1, h2, h3, h4, h5, h6))";

function elementsOverlap(element0: Element, element1: Element) {
	const {
		left: l0,
		right: r0,
		top: t0,
		bottom: b0,
		width: w0,
		height: h0,
	} = element0.getBoundingClientRect();
	const {
		left: l1,
		right: r1,
		top: t1,
		bottom: b1,
	} = element1.getBoundingClientRect();

	const overlap =
		(Math.max(l0, l1) - Math.min(r0, r1)) *
		(Math.max(t0, t1) - Math.min(b0, b1));

	let factor = 0.9;

	// For small elements we require a smaller overlap. The numbers chosen for the
	// area are estimative and might need tweaking
	if (w0 * h0 < 6400) {
		factor = 0.8;
	}

	if (w0 * h0 < 2500) {
		factor = 0.7;
	}

	if (w0 * h0 < 900) {
		factor = 0.6;
	}

	return overlap / (w0 * h0) > factor;
}

function isRedundant(target: Element) {
	const descendantClickables = deepGetElements(target, false).filter(
		(element) => isClickable(element)
	);

	for (const descendant of descendantClickables) {
		if (
			target.childNodes.length === 1 &&
			descendant?.parentElement === target &&
			isVisible(descendant)
		) {
			return true;
		}

		const { width, height } = descendant.getBoundingClientRect();
		if (
			// We have to ignore descendants that aren't visible, for example, an
			// <option> inside a <select>
			width !== 0 &&
			height !== 0 &&
			elementsOverlap(target, descendant) &&
			isVisible(descendant)
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
		// We also make sure the element doesn't contain any clickable
		target.querySelector(clickableSelector + buttonClassSelector)
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
	if (target.closest("[aria-hidden='true']")) {
		return false;
	}

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
