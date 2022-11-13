// Sometimes the element we want to hint contains another element where it makes
// more sense to position the hint. For example, an anchor tag in a sidebar could
// have a padding and inside it a small icon as an SVG and then a span. In this
// case it would make more sense to place the hint next to the SVG. Similarly,
// most of the time, we want the hint next to the text of the hinted element.

import { getElementsFromOrigin } from "../utils/getElementsFromOrigin";
import { isHintable } from "../utils/isHintable";

function elementsOverlap(a: Element, b: Element) {
	const aRect = a.getBoundingClientRect();
	const bRect = b.getBoundingClientRect();

	// If any of the elements doesn't occupy any space we return false
	if (
		aRect.width === 0 ||
		aRect.height === 0 ||
		bRect.width === 0 ||
		bRect.height === 0
	) {
		return false;
	}

	if (
		aRect.right < bRect.left ||
		bRect.right < aRect.left ||
		aRect.bottom < bRect.top ||
		bRect.bottom < aRect.top
	) {
		return false;
	}

	return true;
}

// Returns true if the Text element is not all white space
function hasSignificantText(element: Text): boolean {
	if (element.textContent && /\S/.test(element.textContent)) {
		return true;
	}

	return false;
}

// Returns true if any of the children is a Text node that is not all white space
function hasSignificantTextNodeChild(target: Element) {
	const significantTextNode = [...target.childNodes].find(
		(child) => child instanceof Text && hasSignificantText(child)
	);
	return Boolean(significantTextNode);
}

// Returns true if the element is an image or an element that we think is an icon
function isImage(element: Element) {
	const isImageElement =
		element instanceof HTMLImageElement || element instanceof SVGSVGElement;

	const { backgroundImage, maskImage } = window.getComputedStyle(element);
	const hasOnlyBackgroundImage =
		element.childNodes.length === 0 &&
		(backgroundImage !== "none" || maskImage !== "none");

	const { content } = window.getComputedStyle(element, ":before");
	const isFontIcon =
		element.tagName === "I" && content !== "none" && content !== "normal";

	return isImageElement || hasOnlyBackgroundImage || isFontIcon;
}

function getFirstSignificantTextNode(element: Element): Text | undefined {
	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);

	let current = walker.nextNode() as Text;

	while (current) {
		if (
			hasSignificantText(current) &&
			// We need to make sure that the elements overlap just in case the Text
			// node is hidden or moved out of the viewport
			elementsOverlap(element, current.parentElement!)
		) {
			return current;
		}

		current = walker.nextNode() as Text;
	}

	return undefined;
}

function withinDifferentHintable(node: Element, hintable: Element) {
	let current: Element | null = node;

	while (current && current !== hintable) {
		// TODO: Use getWrapper(current).isHintable once I have separated wrappers
		// to its own module to avoid cyclic dependencies
		if (isHintable(current)) {
			return true;
		}

		current = current.parentElement;
	}

	return false;
}

// Returns the first image or text element ignoring some cases where the element
// has multiple of those, for example, a clickable div block with an avatar and
// some blocks of text.
export function getFirstIconOrTextElement(
	target: Element
): Element | Text | undefined {
	const elements = getElementsFromOrigin(target, true).filter(
		(element) => !element.matches(".rango-hint-wrapper, .rango-hint")
	);
	// For some elements that are highly likely to have an icon plus text we can
	// allow having multiple blocks of image or text
	const allowMultipleBlocks = Boolean(
		target.closest("nav, li, button, [role='button'], [role='treeitem'")
	);
	let firstTextBlockElement: Element | undefined;
	let firstImage;

	for (const element of elements) {
		if (
			allowMultipleBlocks &&
			(firstImage || firstTextBlockElement) &&
			// We want to break once we have exited the first text block element because
			// said element could have an image in it that comes before any text node.
			// Example: <button><img src="path.jpg">click me!</button>
			!firstTextBlockElement?.contains(element)
		) {
			break;
		}

		const { opacity } = window.getComputedStyle(element);

		if (opacity === "0" || !elementsOverlap(target, element)) {
			continue;
		}

		if (isImage(element)) {
			if (firstImage && !allowMultipleBlocks) {
				// There is more than one logo or icon in the element
				return undefined;
			}

			const differentHintable = withinDifferentHintable(element, target);

			if (differentHintable && !allowMultipleBlocks) {
				return undefined;
			}

			if (!firstImage && !differentHintable) {
				firstImage = element;
			}
		}

		if (hasSignificantTextNodeChild(element)) {
			if (firstTextBlockElement && !firstTextBlockElement.contains(element)) {
				// There is more than one significant block of text
				return undefined;
			}

			const differentHintable = withinDifferentHintable(element, target);

			if (differentHintable && !allowMultipleBlocks) {
				return undefined;
			}

			if (!firstTextBlockElement && !differentHintable) {
				firstTextBlockElement = element;
			}
		}
	}

	const firstText = firstTextBlockElement
		? getFirstSignificantTextNode(firstTextBlockElement)
		: undefined;

	// If there is both a first image and a first text we return the one that
	// let picomHerecomes first in the document
	if (firstImage && firstText) {
		return firstImage.compareDocumentPosition(firstText) === 4
			? firstImage
			: firstText;
	}

	return firstImage ?? firstText;
}

// This functions returns the element where the hint should be positioned
export function getElementToPositionHint(target: Element) {
	if (
		target instanceof HTMLInputElement ||
		target instanceof HTMLTextAreaElement ||
		target instanceof HTMLSelectElement ||
		target instanceof HTMLOptionElement
	) {
		return target;
	}

	const firstImageOrText = getFirstIconOrTextElement(target);

	return firstImageOrText ?? target;
}
