/**
 * Utility functions for detecting visible text content in elements.
 * Used to determine if elements should be hinted based on their text content.
 */

import { getCachedStyle } from "../hints/layoutCache";

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
 * Checks if an element is hidden via CSS.
 * Uses getCachedStyle to prevent layout thrashing.
 */
function isElementHidden(element: Element): boolean {
	const style = getCachedStyle(element);
	return (
		style.display === "none" ||
		style.visibility === "hidden" ||
		style.opacity === "0"
	);
}

/**
 * Gets text content from an element excluding text that comes from icon descendants
 * and hidden elements. This helps identify when an element's text is purely from
 * icon fonts or hidden badges vs meaningful visible content.
 */
function getTextExcludingIconDescendants(element: Element): string {
	const texts: string[] = [];

	const walker = document.createTreeWalker(
		element,
		NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, // eslint-disable-line no-bitwise
		{
			acceptNode(node) {
				if (node instanceof Text) {
					return NodeFilter.FILTER_ACCEPT;
				}

				// At this point node is guaranteed to be an Element given our whatToShow
				if (
					node instanceof Element &&
					(node.matches(iconAndVisualElementsSelector) || isElementHidden(node))
				) {
					// FILTER_REJECT skips the element and all its descendants
					return NodeFilter.FILTER_REJECT;
				}

				// FILTER_SKIP continues into children without accepting this node
				return NodeFilter.FILTER_SKIP;
			},
		}
	);

	let current = walker.nextNode();
	while (current) {
		texts.push(current.textContent ?? "");
		current = walker.nextNode();
	}

	return texts.join("").trim();
}

/**
 * Gets the text content from associated labels for labelable elements.
 */
function getAssociatedLabelText(element: Element): string | undefined {
	if ("labels" in element) {
		const labels = element.labels as NodeListOf<HTMLLabelElement> | null;
		if (labels?.[0]) {
			return labels[0].textContent?.trim();
		}
	}

	return undefined;
}

/**
 * Checks if an element has meaningful visible text content.
 * This looks for substantial text that would serve as a clear label,
 * including text from the element itself and associated labels.
 */
function hasActualVisibleText(element: Element): boolean {
	// Get visible text from element - for inputs, check value/placeholder
	let elementText: string | undefined;

	if (
		element instanceof HTMLInputElement ||
		element instanceof HTMLTextAreaElement
	) {
		// For input elements, check value first, then placeholder, then text content
		const value = element.value?.trim();
		const placeholder = element.placeholder?.trim();
		const textContent = getTextExcludingIconDescendants(element);

		elementText =
			value && value.length > 0
				? value
				: placeholder && placeholder.length > 0
					? placeholder
					: textContent;
	} else if (element instanceof HTMLSelectElement) {
		// For select elements, check if there are meaningful options
		const options = Array.from(element.options);
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
