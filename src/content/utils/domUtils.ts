export const editableElementSelector =
	"input:not(:is([type='button'], [type='checkbox'], [type='color'], [type='file'], [type='hidden'], [type='image'], [type='radio'], [type='range'], [type='reset'], [type='submit'])), textarea, [contenteditable=''], [contenteditable='true']";

export function elementIsEditable(element: Element | null) {
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
