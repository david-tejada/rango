/**
 * Get all elements between two elements that are similar. Elements are considered similar if
 * they have the same tag name and their classes are similar.
 *
 * @param start - The start element.
 * @param end - The end element.
 * @returns An array of all elements between the start and end element that are similar.
 */
export function getSimilarElementsInRange(
	start: Element,
	end: Element
): Element[] {
	const commonAncestor = findCommonAncestor(start, end);
	if (!commonAncestor) return [];

	// Get all elements between start and end that are similar
	const elements = getAllElementsBetween(start, end, commonAncestor);
	return elements.filter(
		(element) =>
			isSimilarElement(element, start) || isSimilarElement(element, end)
	);
}

function findCommonAncestor(element1: Element, element2: Element) {
	const ancestors1 = getAncestors(element1);
	const ancestors2 = getAncestors(element2);

	return ancestors1.find((ancestor) => ancestors2.includes(ancestor));
}

function getAncestors(element: Element) {
	const ancestors: Element[] = [];
	let current: Element | null = element;

	while (current) {
		ancestors.push(current);
		current = current.parentElement;
	}

	return ancestors;
}

function getAllElementsBetween(
	start: Element,
	end: Element,
	commonAncestor: Element
) {
	const walker = document.createTreeWalker(
		commonAncestor,
		NodeFilter.SHOW_ELEMENT,
		null
	);

	const [firstElement, lastElement] = sortByDocumentPosition([start, end]);

	const elements: Element[] = [];
	let currentNode = walker.currentNode as Element;
	let foundFirst = false;
	let foundLast = false;

	// Walk through all elements in DOM order starting with the common ancestor.
	// Push elements to the array if they are between the first and last element.
	while (currentNode && !foundLast) {
		if (currentNode === firstElement) {
			foundFirst = true;
		}

		if (foundFirst) {
			elements.push(currentNode);
		}

		if (currentNode === lastElement) {
			foundLast = true;
		}

		currentNode = walker.nextNode() as Element;
	}

	// If we didn't find both elements, return empty array
	if (!foundFirst || !foundLast) {
		return [];
	}

	return elements;
}

function sortByDocumentPosition(elements: Element[]) {
	return elements.sort((a, b) => {
		// eslint-disable-next-line no-bitwise
		return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
			? -1
			: 1;
	});
}

function isSimilarElement(element1: Element, element2: Element) {
	if (element1.tagName !== element2.tagName) return false;

	const classes1 = Array.from(element1.classList);
	const classes2 = Array.from(element2.classList);

	// If neither element has classes, they're considered similar
	if (classes1.length === 0 && classes2.length === 0) return true;

	const commonClasses = classes1.filter((cls) => classes2.includes(cls));

	// Calculate similarity ratio based on the element with fewer classes
	const minClassCount = Math.min(classes1.length, classes2.length);
	const similarityRatio = commonClasses.length / minClassCount;

	// Consider elements similar if they share at least 80% of their classes
	return similarityRatio >= 0.8;
}
