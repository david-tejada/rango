// Sometimes the element we want to hint contains another element where it makes
// more sense to position the hint. For example, an anchor tag in a sidebar could
// have a padding and inside it a small icon as an SVG and then a span. In this
// case it would make more sense to place the hint next to the SVG. Similarly,
// most of the time, we want the hint next to the text of the hinted element.

import { deepGetElements } from "../utils/deepGetElements";
import { getWrapperForElement } from "../wrappers";
import {
	getBoundingClientRect,
	getCachedStyle,
	getFirstCharacterRect,
} from "./layoutCache";

declare global {
	interface CSSStyleDeclaration {
		maskImage: string;
	}
}

function elementsAreNear(a: Element, b: Element) {
	const aRect = getBoundingClientRect(a);
	const bRect = getBoundingClientRect(b);
	const margin = 100;

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
		aRect.right + margin < bRect.left ||
		bRect.right + margin < aRect.left ||
		aRect.bottom + margin < bRect.top ||
		bRect.bottom + margin < aRect.top
	) {
		return false;
	}

	return true;
}

// Returns true if the Text element is not all white space
function hasSignificantText(element: Text): boolean {
	if (element.textContent && /\S/.test(element.textContent)) {
		const rect = getFirstCharacterRect(element);
		return rect.width !== 0 && rect.height !== 0;
	}

	return false;
}

// Returns true if any of the children is a Text node that is not all white space
function hasSignificantTextNodeChild(target: Element) {
	const { textIndent } = getCachedStyle(target);
	const textIndentNumber = Number.parseInt(textIndent, 10);

	if (Math.abs(textIndentNumber) > 100) {
		return false;
	}

	if (
		typeof target.className === "string" &&
		target.className.includes("hidden")
	) {
		return false;
	}

	return [...target.childNodes].some(
		(child) => child instanceof Text && hasSignificantText(child)
	);
}

// Returns true if the element is an image or an element that we think is an icon
function isImage(element: Element) {
	const isImageElement =
		element instanceof HTMLImageElement || element instanceof SVGSVGElement;

	const { backgroundImage, maskImage } = getCachedStyle(element);
	const hasOnlyBackgroundImage =
		element.childNodes.length === 0 &&
		(backgroundImage !== "none" ||
			(Boolean(maskImage) && maskImage !== "none"));

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
			elementsAreNear(element, current.parentElement!)
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
		if (getWrapperForElement(current)?.isHintable) {
			return true;
		}

		current = current.parentElement;
	}

	return false;
}

function getFirstIconOrTextElement(
	target: Element
): Element | Text | undefined {
	const elements = deepGetElements(target, true).filter(
		(element) => !element.matches(".rango-hint")
	);

	let firstTextBlockElement: Element | undefined;
	let firstImage;

	for (const element of elements) {
		const { opacity } = getCachedStyle(element);

		if (
			opacity === "0" ||
			withinDifferentHintable(element, target) ||
			!elementsAreNear(target, element)
		) {
			continue;
		}

		if (isImage(element)) firstImage ??= element;

		if (!firstTextBlockElement && hasSignificantTextNodeChild(element)) {
			firstTextBlockElement = element;
		}
	}

	const firstText = firstTextBlockElement
		? getFirstSignificantTextNode(firstTextBlockElement)
		: undefined;

	// If there is both a first image and a first text we return the one that
	// comes first in the document
	if (firstImage && firstText) {
		// 4: firstText follows firstImage. Since firstImage can't contain firstText
		// we don't need to worry about other cases
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

	return getFirstIconOrTextElement(target) ?? target;
}
