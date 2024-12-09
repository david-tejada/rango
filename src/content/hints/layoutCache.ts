import { type ElementWrapper } from "../wrappers/ElementWrapper";

const boundingClientRects = new Map<Element, DOMRect>();
const offsetParents = new Map<Element, Element | null>();
const firstCharacterRects = new Map<Text, DOMRect>();
const textRects = new Map<Text, DOMRect>();
const clientDimensions = new Map<
	Element,
	{
		clientWidth: number;
		scrollWidth: number;
		clientHeight: number;
		scrollHeight: number;
		offsetWidth?: number;
		offsetHeight?: number;
	}
>();
const styles = new Map<Element, CSSStyleDeclaration>();

export function clearLayoutCache() {
	boundingClientRects.clear();
	offsetParents.clear();
	firstCharacterRects.clear();
	textRects.clear();
	clientDimensions.clear();
	styles.clear();
}

export function removeFromLayoutCache(element: Element) {
	boundingClientRects.delete(element);
	offsetParents.delete(element);
	clientDimensions.delete(element);
	styles.delete(element);
}

function getFirstTextNodes(element: Element) {
	const nodes = [];

	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);

	while (nodes.length < 2 && walker.nextNode()) {
		if (
			walker.currentNode instanceof Text &&
			walker.currentNode.parentElement?.matches(
				":not(.rango-hint, script, style)"
			) &&
			walker.currentNode.textContent &&
			/\S/.test(walker.currentNode.textContent)
		) {
			nodes.push(walker.currentNode);
		}
	}

	return nodes;
}

function textNodeRect(textNode: Text): DOMRect {
	const range = document.createRange();
	range.setStart(textNode, 0);
	range.setEnd(textNode, textNode.length);
	return range.getBoundingClientRect();
}

function firstCharacterRect(textNode: Text): DOMRect {
	if (!textNode.textContent) {
		return new DOMRect(0, 0, 0, 0);
	}

	const firstNonWhiteSpaceCharacterIndex =
		textNode.textContent?.search(/\S/) ?? 0;

	// We need to know the character size. For example, with emojis the
	// character size is 2.
	// https://stackoverflow.com/q/46157867
	const firstNonWhiteSpaceCharacter = [...textNode.textContent][
		firstNonWhiteSpaceCharacterIndex
	];
	const charactersSize = firstNonWhiteSpaceCharacter
		? firstNonWhiteSpaceCharacter.length
		: 0;

	const range = document.createRange();
	range.setStart(textNode, firstNonWhiteSpaceCharacterIndex);
	range.setEnd(textNode, firstNonWhiteSpaceCharacterIndex + charactersSize);
	const rect = range.getBoundingClientRect();
	return rect;
}

function isElementWrapperArray(
	targets: ElementWrapper[] | Array<Element | SVGElement | Text>
): targets is ElementWrapper[] {
	if (targets[0] && "isHintable" in targets[0]) return true;
	return false;
}

export function cacheLayout(
	targets: ElementWrapper[] | Array<Element | SVGElement | Text>,
	includeTextRect = true
) {
	const elements = isElementWrapperArray(targets)
		? targets.map((wrapper) => wrapper.element)
		: targets;
	const toCache = new Set<Element>();

	const firstTextNodes = new Map<Element, Text[]>();

	for (const element of elements) {
		if (element instanceof Element && includeTextRect) {
			firstTextNodes.set(element, getFirstTextNodes(element));
		}
	}

	for (const element of elements) {
		if (element instanceof Element && includeTextRect) {
			const textNodes = firstTextNodes.get(element);

			if (!textNodes) continue;

			for (const node of textNodes) {
				firstCharacterRects.set(node, firstCharacterRect(node));
				textRects.set(node, textNodeRect(node));
			}
		}

		const descendants =
			element instanceof Element ? element.querySelectorAll("*") : [];

		for (const descendant of descendants) toCache.add(descendant);

		let current: Element | null = element instanceof Element ? element : null;
		let counter = 0;

		while (current && counter < 10) {
			if (toCache.has(current)) break;

			toCache.add(current);

			current = current.parentElement;
			counter++;
		}
	}

	for (const element of toCache) {
		boundingClientRects.set(element, element.getBoundingClientRect());
		const { clientWidth, scrollWidth, clientHeight, scrollHeight } = element;
		clientDimensions.set(element, {
			clientWidth,
			scrollWidth,
			clientHeight,
			scrollHeight,
			offsetWidth:
				element instanceof HTMLElement ? element.offsetWidth : undefined,
			offsetHeight:
				element instanceof HTMLElement ? element.offsetHeight : undefined,
		});
		styles.set(element, getComputedStyle(element));

		if (element instanceof HTMLElement) {
			offsetParents.set(element, element.offsetParent);
		}
	}
}

export function getBoundingClientRect(element: Element) {
	return boundingClientRects.get(element) ?? element.getBoundingClientRect();
}

export function getOffsetParent(target: HTMLElement) {
	return offsetParents.get(target) ?? target.offsetParent;
}

export function getFirstCharacterRect(text: Text) {
	return firstCharacterRects.get(text) ?? firstCharacterRect(text);
}

export function getClientDimensions(element: Element) {
	const { clientWidth, scrollWidth, clientHeight, scrollHeight } =
		clientDimensions.get(element) ?? element;

	const offsetWidth =
		element instanceof HTMLElement
			? (clientDimensions.get(element)?.offsetWidth ?? element.offsetWidth)
			: undefined;
	const offsetHeight =
		element instanceof HTMLElement
			? (clientDimensions.get(element)?.offsetHeight ?? element.offsetHeight)
			: undefined;

	return {
		clientWidth,
		scrollWidth,
		clientHeight,
		scrollHeight,
		offsetWidth,
		offsetHeight,
	};
}

export function getCachedStyle(element: Element) {
	return styles.get(element) ?? getComputedStyle(element);
}
