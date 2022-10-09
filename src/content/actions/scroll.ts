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
 * the rectangle that is actually intersecting the viewport
 */
function getIntersectionWithViewport(element: Element): DOMRect {
	const viewportHeight = document.documentElement.clientHeight;
	const viewportWidth = document.documentElement.clientWidth;

	const { left, right, top, bottom } = element.getBoundingClientRect();

	const intersectionLeft = Math.max(0, left);
	const intersectionRight = Math.min(right, viewportWidth);
	const intersectionTop = Math.max(0, top);
	const intersectionBottom = Math.min(viewportHeight, bottom);

	/**
	 * The overflow of an element is actually outside the boundaries of the
	 * element's rect. That means that when we scroll the <html> or <body> the part
	 * of the element that's actually visible in the viewport could be not
	 * included within the element's rect. Since we are interested in what's
	 * visible of the element we start from (0, 0) in those cases.
	 */
	const isHtmlOrBodyElement =
		element === document.documentElement || element === document.body;

	const x = isHtmlOrBodyElement ? 0 : intersectionLeft;
	const y = isHtmlOrBodyElement ? 0 : intersectionTop;
	const width = isHtmlOrBodyElement
		? viewportWidth
		: intersectionRight - intersectionLeft;
	const height = isHtmlOrBodyElement
		? viewportHeight
		: intersectionBottom - intersectionTop;

	return new DOMRect(x, y, width, height);
}

export function snapScroll(
	position: "top" | "center" | "bottom",
	target: ElementWrapper
) {
	const scrollContainer = target.scrollContainer;

	if (!scrollContainer) {
		// I should probably notify the user that the element doesn't scroll when I
		// implement toast notifications
		throw new Error("Selected element doesn't scroll");
	}

	const isPageScroll = scrollContainer.matches("body, html");

	const {
		top: cTop,
		bottom: cBottom,
		height: cHeight,
	} = getIntersectionWithViewport(scrollContainer);
	const cCenter = cTop + cHeight / 2;

	const { top, bottom, height } = target.element.getBoundingClientRect();
	const center = top + height / 2;

	let scrollAmount;

	if (position === "top") {
		scrollAmount = isPageScroll ? top : top - cTop;
	}

	if (position === "center") {
		scrollAmount = center - cCenter;
	}

	if (position === "bottom") {
		scrollAmount = isPageScroll ? -(cHeight - bottom) : -(cBottom - bottom);
	}

	scrollContainer.scrollBy(0, scrollAmount);

	// Handle sticky headers
	if (position === "top") {
		let stickyFound: boolean;

		// If we find a sticky element we scroll so that the top of our target
		// element coincides with the bottom of the sticky element. We keep doing
		// this in case there are stacked sticky elements
		do {
			stickyFound = false;
			const { x, y, top } = target.element.getBoundingClientRect();
			const elementsAtCoordinates = document.elementsFromPoint(x + 5, y + 5);

			for (const element of elementsAtCoordinates) {
				if (element === target.element || element.contains(target.element)) {
					break;
				}

				const { position, display, visibility, opacity } =
					window.getComputedStyle(element);

				if (
					display !== "none" &&
					visibility !== "hidden" &&
					opacity !== "0" &&
					(position === "sticky" || position === "fixed")
				) {
					const stickyBottom = element.getBoundingClientRect().bottom;
					scrollContainer.scrollBy(0, top - stickyBottom);
					stickyFound = true;
					break;
				}
			}
		} while (stickyFound);
	}
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
		const { clientHeight, clientWidth, scrollHeight, scrollWidth } =
			document.documentElement;

		scrollContainer =
			clientHeight === scrollHeight && clientWidth === scrollWidth
				? document.body
				: document.documentElement;
	}

	const containerRect = getIntersectionWithViewport(scrollContainer);
	const { width: scrollWidth, height: scrollHeight } = containerRect;

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
