interface ScrollContainerDimensions {
	clientHeight: number;
	scrollHeight: number;
	clientWidth: number;
	scrollWidth: number;
}

function scrollContainerMutated(
	element: Element,
	lastKnownDimensions: ScrollContainerDimensions
): boolean {
	for (const [key, value] of Object.entries(lastKnownDimensions)) {
		const previousValue = element[key as keyof ScrollContainerDimensions];
		if (previousValue !== value) {
			return true;
		}
	}

	return false;
}

const scrollContainers: Map<Element, ScrollContainerDimensions> = new Map();

function addScrollContainer(element: Element) {
	if (!scrollContainers.has(element)) {
		scrollContainers.set(element, {
			clientHeight: element.clientHeight,
			scrollHeight: element.scrollHeight,
			clientWidth: element.clientWidth,
			scrollWidth: element.scrollWidth,
		});
	}

	// We sort the containers from bottom to top
	// const sorted = Array.from(this.items).sort((a, b) => {
	// 	const comparison = a.compareDocumentPosition(b);
	// 	if (comparison === 4 || comparison === 20) {
	// 		return +1;
	// 	}

	// 	return -1;
	// });

	// this.items = new Set(sorted);
}

export function maybeAddScrollContainer(element: Element) {
	if (scrollContainers.has(element)) {
		return;
	}

	if (
		element === document.body &&
		document.documentElement.clientHeight !==
			document.documentElement.scrollHeight
	) {
		// https://makandracards.com/makandra/55801-does-html-or-body-scroll-the-page
		addScrollContainer(document.scrollingElement ?? document.documentElement);
		return;
	}

	if (
		(element.scrollHeight > element.clientHeight ||
			element.scrollWidth > element.clientWidth) &&
		/scroll|auto/.test(window.getComputedStyle(element).overflow)
	) {
		addScrollContainer(element);
		return;
	}

	if (
		window.getComputedStyle(element).position === "sticky" ||
		window.getComputedStyle(element).position === "fixed"
	) {
		addScrollContainer(element);
	}
}

export function getScrollContainer(element: Element): Element {
	const reversedScrollContainers = Array.from(scrollContainers)
		.map((record) => record[0])
		.reverse();

	for (const scrollContainer of reversedScrollContainers) {
		if (scrollContainer.contains(element)) {
			return scrollContainer;
		}
	}

	return document.documentElement;
}

maybeAddScrollContainer(document.body);
