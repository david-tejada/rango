export const editableElementSelector =
	"input:not(:is([type='button'], [type='checkbox'], [type='color'], [type='file'], [type='hidden'], [type='image'], [type='radio'], [type='range'], [type='reset'], [type='submit'])), textarea, [contenteditable=''], [contenteditable='true']";

export function isEditable(element: Element | null) {
	if (!element) return false;

	return element.matches(editableElementSelector);
}

/**
 * Get the closest (towards the root) HTMLElement relative to a Node. If the
 * node itself is an HTMLElement we return it.
 *
 * @param node The Node to start the search
 * @returns The closest HTMLElement relative to this node or null
 */
export function getClosestHtmlElement(node: Node) {
	let current: Node | null = node;

	while (current && !(current instanceof HTMLElement)) {
		current = current.parentElement;
	}

	return current;
}

/**
 * Returns the active element for the document. If the active element is a
 * shadow host it goes into the shadow root, recursively if necessary, to
 * retrieve the actual active element.
 */
export function getActiveElement() {
	let activeElement = document.activeElement;

	while (activeElement?.shadowRoot) {
		activeElement = activeElement.shadowRoot.activeElement;
	}

	return activeElement;
}

const focusableSelector =
	":is(a[href], area[href], input, select, textarea, button, iframe, object, summary, [tabindex]):not(:is([disabled], [tabindex='-1'], [contenteditable='false']))";

/**
 * Returns the element itself if it's focusable. If not, the closest focusable
 * descendant or ascendant, in that order.
 * The reason to check descendants is for instances where we mark as hintable
 * the parent and not the child. For example, if the parent is a wrapper
 * div[role="button"] and the child is a button.
 */
export function getFocusable(element: Element) {
	return element.matches(focusableSelector)
		? element
		: element.querySelector(focusableSelector) ??
				element.closest(focusableSelector);
}
