export function isClickable(element: Element): boolean {
	const clickableSelector =
		"button, a, input, summary, textarea, select, option, label, " +
		"[role='button'], [role='link'], [role='treeitem'], [role='tab'], " +
		"[role='option'], [role='radio'], [role='checkbox'], [role='menuitem'], " +
		"[role='menuitemradio'], [contenteditable='true'], [contenteditable=''], [jsaction]";

	if (element.matches(clickableSelector)) {
		return true;
	}

	if (
		window.getComputedStyle(element).cursor === "pointer" &&
		element.parentElement &&
		window.getComputedStyle(element.parentElement).cursor !== "pointer"
	) {
		return true;
	}

	return false;
}
