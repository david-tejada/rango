import { createsStackingContext } from "./createsStackingContext";

const stackContainers: Set<Element> = new Set();

export function isScrollContainer(element: Element): boolean {
	// SCROLL CONTAINER
	if (
		element === document.body &&
		document.documentElement.clientHeight !==
			document.documentElement.scrollHeight
	) {
		// https://makandracards.com/makandra/55801-does-html-or-body-scroll-the-page
		// addStackContainer(document.scrollingElement ?? document.documentElement);
		return false;
	}

	const style = window.getComputedStyle(element);

	if (style.position === "sticky" || style.position === "fixed") {
		return true;
	}

	if (
		(element.scrollHeight > element.clientHeight ||
			element.scrollWidth > element.clientWidth) &&
		/scroll|auto/.test(style.overflow)
	) {
		return true;
	}

	return false;
}

export function getStackContainer(element: Element): Element {
	let node: Element | null = element.parentElement;

	while (node) {
		if (stackContainers.has(node)) return node;

		if (node === document.documentElement) return document.body;

		if (createsStackingContext(node) || isScrollContainer(node)) {
			stackContainers.add(node);
			return node;
		}

		node = node.parentElement;
	}

	return document.body;
}
