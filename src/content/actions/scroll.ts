/* eslint-disable capitalized-comments */
import { ElementWrapper } from "../wrappers";

const DEFAULT_SCROLL_FACTOR = 0.66;

let lastScrollContainer: HTMLElement | undefined;
let lastScrollFactor: number;

interface ScrollOptions {
	dir: "up" | "down" | "left" | "right";
	target?: ElementWrapper;
	repeatLastScroll?: boolean;
	factor?: number;
}

/**
 * Since the scroll container could be spanning beyond the viewport we need
 * the rectangle that it's actually intersecting the viewport
 */
function getIntersectionWithViewport(element: Element): DOMRect {
	const { left, right, top, bottom } = element.getBoundingClientRect();
	const viewportHeight = document.documentElement.clientHeight;
	const viewportWidth = document.documentElement.clientWidth;

	const intersectionLeft = Math.max(0, left);
	const intersectionRight = Math.min(right, viewportWidth);
	const intersectionTop = Math.max(0, top);

	const intersectionBottom = Math.min(viewportHeight, bottom);

	return new DOMRect(
		intersectionLeft, // x
		intersectionTop, // y
		intersectionRight - intersectionLeft, // width
		intersectionBottom - intersectionTop // height
	);
}

export function snapScroll(
	target: ElementWrapper,
	position: "top" | "center" | "bottom"
) {
	const scrollContainer = target.scrollContainer;

	if (!scrollContainer) {
		// I should probably notify the user that the element doesn't scroll
		throw new Error("Selected element doesn't scroll");
	}

	const isPageScroll = scrollContainer.matches("body, head");
}

export function scroll(options: ScrollOptions) {
	const { dir, target, repeatLastScroll } = options;
	let factor = options.factor;
	let scrollContainer;

	if (target && repeatLastScroll) {
		throw new Error("Can't specify both a target and repeatLastTarget.");
	}

	if (repeatLastScroll && (!lastScrollContainer || !lastScrollFactor)) {
		throw new Error("Unable to repeat the last scroll");
	}

	if (target) {
		scrollContainer = target.scrollContainer;
		if (!scrollContainer) {
			// I should probably notify the user that the element doesn't scroll
			throw new Error("Selected element doesn't scroll");
		}

		// We store the values for future use
		lastScrollContainer = scrollContainer;
	}

	if (repeatLastScroll) {
		scrollContainer = lastScrollContainer;
		factor = lastScrollFactor;
	}

	// Page scroll
	if (!target && !repeatLastScroll) {
		const { clientHeight, scrollHeight } = document.documentElement;
		scrollContainer =
			clientHeight === scrollHeight ? document.body : document.documentElement;
	}

	const { width: scrollWidth, height: scrollHeight } =
		getIntersectionWithViewport(scrollContainer);

	let left = 0;
	let top = 0;
	factor ??= DEFAULT_SCROLL_FACTOR;
	lastScrollFactor = factor;

	if (dir === "up") top = -scrollHeight * factor;
	if (dir === "down") top = scrollHeight * factor;
	if (dir === "left") left = -scrollWidth * factor;
	if (dir === "right") left = scrollWidth * factor;

	//
	const previousScrollBehavior =
		window.getComputedStyle(scrollContainer).scrollBehavior;
	scrollContainer.style.scrollBehavior = "auto";

	scrollContainer.scrollBy({ left, top, behavior: "auto" });
	scrollContainer.style.scrollBehavior = previousScrollBehavior;
}
