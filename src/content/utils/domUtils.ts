export const editableElementSelector =
	"input:not(:is([type='button'], [type='checkbox'], [type='color'], [type='file'], [type='hidden'], [type='image'], [type='radio'], [type='reset'], [type='submit'])), textarea, [contenteditable=''], [contenteditable='true']";

export function elementIsEditable(element: Element | null) {
	if (!element) return false;

	return element.matches(editableElementSelector);
}
