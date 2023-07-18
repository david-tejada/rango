export const editableElementSelector =
	"input:not(:is([type='button'], [type='checkbox'], [type='color'], [type='file'], [type='hidden'], [type='image'], [type='radio'], [type='reset'], [type='submit'])), textarea, [contenteditable=''], [contenteditable='true']";

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
