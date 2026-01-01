/**
 * Utility functions for detecting visible text content in elements.
 * Used to determine if elements should be hinted based on their text content.
 */

/**
 * CSS selector for detecting icons, images, and visual-only elements.
 * Used both for direct element detection and for filtering out icon text content.
 */
const iconAndVisualElementsSelector =
	// Standard image and media elements
	"img, svg, canvas, video, audio, " +
	// Elements with semantic image role
	"[role='img'], " +
	// Icon font patterns - <i> tags with icon-related classes
	"i[class*='icon'], " + // Generic icon libraries (Material Icons, Bootstrap Icons, etc.)
	"i[class*='fa-'], " + // Font Awesome icons (fa-solid, fa-regular, fa-home, etc.)
	"i[class*='material-icons'], " + // Material Design Icons specifically
	"i[class*='google-symbols']"; // Google Symbols (used in Google Meet, etc.)

/**
 * Checks if an element is an icon, image, or visual-only element
 * that should always be hintable regardless of text content.
 */
function isIconOrImage(element: Element): boolean {
	return element.matches(iconAndVisualElementsSelector);
}

/**
 * Checks if an element is hidden via CSS (display: none or visibility: hidden).
 */
function isElementHidden(element: Element): boolean {
	const style = getComputedStyle(element);
	return style.display === "none" || style.visibility === "hidden";
}

/**
 * Gets text content from an element excluding text that comes from icon descendants
 * and hidden elements. This helps identify when an element's text is purely from
 * icon fonts or hidden badges vs meaningful visible content.
 */
function getTextExcludingIconDescendants(element: Element): string {
	const texts: string[] = [];

	function collectVisibleText(node: Node) {
		if (node.nodeType === Node.TEXT_NODE) {
			texts.push(node.textContent ?? "");
			return;
		}

		if (node.nodeType === Node.ELEMENT_NODE) {
			const el = node as Element;

			// Skip icon elements
			if (el.matches(iconAndVisualElementsSelector)) {
				return;
			}

			// Skip hidden elements
			if (isElementHidden(el)) {
				return;
			}

			// Recurse into children
			for (const child of node.childNodes) {
				collectVisibleText(child);
			}
		}
	}

	// Iterate through children to collect visible text, skipping hidden descendants
	for (const child of element.childNodes) {
		collectVisibleText(child);
	}

	return texts.join("").trim();
}

/**
 * Gets the text content from associated labels for form controls.
 * This helper function extracts label text that can be used for voice targeting.
 */
function getAssociatedLabelText(element: Element): string | undefined {
	if (!element.matches("input, select, textarea")) return undefined;

	// Check for associated label element
	const id = element.getAttribute("id");
	const associatedLabel = id
		? document.querySelector(`label[for="${id}"]`)
		: null;
	const wrappingLabel = element.closest("label");

	// Return the first available label text
	return (
		associatedLabel?.textContent?.trim() ?? wrappingLabel?.textContent?.trim()
	);
}

/**
 * Checks if an element has meaningful visible text content.
 * This looks for substantial text that would serve as a clear label,
 * including text from the element itself and associated labels.
 */
function hasActualVisibleText(element: Element): boolean {
	// Get visible text from element - for inputs, check value/placeholder
	let elementText: string | undefined;

	if (element.matches("input, textarea")) {
		const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
		// For input elements, check value first, then placeholder, then text content
		const value = inputElement.value?.trim();
		const placeholder = inputElement.placeholder?.trim();
		const textContent = getTextExcludingIconDescendants(element);

		elementText =
			value && value.length > 0
				? value
				: placeholder && placeholder.length > 0
					? placeholder
					: textContent;
	} else if (element.matches("select")) {
		// For select elements, check if there are meaningful options
		const selectElement = element as HTMLSelectElement;
		const options = Array.from(selectElement.options);
		const meaningfulOptions = options.filter((option) => {
			const text = option.textContent?.trim();
			if (!text) return false;
			// Allow multi-character text or single digits
			return text.length > 1 || /\d/.test(text);
		});
		// If there are meaningful options, the select has targetable content
		if (meaningfulOptions.length > 0) {
			return true;
		}

		// For selects without meaningful options, don't use textContent
		// because it concatenates all option text which may create false positives
		elementText = undefined;
	} else {
		// For other elements, use text content excluding icon descendants
		elementText = getTextExcludingIconDescendants(element);
	}

	// Check for associated label text for form controls
	const labelText = getAssociatedLabelText(element);

	// Combine all available text sources - prefer element text, fall back to label text
	const allText =
		elementText && elementText.length > 0 ? elementText : labelText;

	// If no text at all, definitely no visible text
	if (!allText || !/\w+/.test(allText)) {
		return false;
	}

	// Allow single characters only if they are digits
	if (allText.length === 1 && !/\d/.test(allText)) {
		return false;
	}

	// If element has meaningful text content, it has visible text
	return true;
}

/**
 * Determines if an element contains visible text content that can be targeted by voice.
 *
 * The principle: If an element has visible text that can be targeted using voice text selection,
 * then it doesn't need a Rango hint. Only elements without targetable text need hints.
 *
 * Elements are considered to have "no targetable text" (and thus should be hinted) if they are:
 * - Icons, images, or visual-only elements
 * - Interactive elements with only single characters or symbols
 * - Form controls without any visible text (no value, placeholder, or label)
 *
 * Elements are considered to have "targetable text" (and thus should NOT be hinted) if they:
 * - Contain multi-character visible text that can be spoken to target the element
 * - Have associated labels that provide targetable text
 * - Are form controls with meaningful values, placeholders, or option text
 *
 * @param element The element to check
 * @returns false if element should be hinted (no targetable text), true if it has targetable text
 */
export function hasVisibleText(element: Element): boolean {
	// Always hint icons and images - these are purely visual elements
	if (isIconOrImage(element)) {
		return false; // No targetable text, so should be hinted
	}

	// For all elements (including form controls), check if they have meaningful visible text
	return hasActualVisibleText(element);
}
