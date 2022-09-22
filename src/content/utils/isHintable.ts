const clickableSelector =
	// Elements
	"button, a, input, summary, textarea, select, option, label, " +
	// Roles
	"[role='button'], [role='link'], [role='treeitem'], [role='tab'], [role='option'], " +
	"[role='radio'], [role='checkbox'], [role='menuitem'], [role='menuitemradio'], " +
	// Attributes
	"[contenteditable='true'], [contenteditable=''], [jsaction]";

// Maximum distance between an element and it's descendent to be considered
// a redundantc clickable element
const OVERLAP_THRESHOLD = 10;

function isRedundant(element: Element) {
	const descendantClickables = element.querySelectorAll(clickableSelector);
	for (const descendant of descendantClickables) {
		const elementRect = element.getBoundingClientRect();
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

export function isHintable(element: Element): boolean {
	if (element.matches(clickableSelector)) {
		return !isRedundant(element);
	}

	if (
		window.getComputedStyle(element).cursor === "pointer" &&
		element.parentElement &&
		window.getComputedStyle(element.parentElement).cursor !== "pointer" &&
		!element.parentElement.matches(clickableSelector) &&
		!element.firstElementChild?.matches(clickableSelector)
	) {
		return !isRedundant(element);
	}

	return false;
}
