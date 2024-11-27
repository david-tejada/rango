/**
 * Check if a given selector is valid, that is, it doesn't error when used as
 * the argument for methods like document.querySelector and
 * document.querySelectorAll.
 *
 * @param selector The string to check if it's a valid selector
 * @returns true if the selector is valid and false if not
 */
export function isValidSelector(selector: string) {
	try {
		document.querySelector(selector);
	} catch (error: unknown) {
		if (error instanceof DOMException) {
			return false;
		}
	}

	return true;
}
