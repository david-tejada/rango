import { isHtmlElement } from "../../typings/TypingUtils";
import { getCachedSetting } from "../settings/cacheSettings";
import { getUserScrollableContainer } from "../utils/getUserScrollableContainer";
import { ElementWrapper } from "../../typings/ElementWrapper";

const DEFAULT_SCROLL_FACTOR = 0.66;

// Officially "instant" is not part of the specification yet, although it works
// in Firefox, Chrome and Safari.
declare global {
	interface ScrollToOptions {
		left?: number;
		top?: number;
		behavior?: "auto" | "instant" | "smooth";
	}
}

let lastScrollContainer: HTMLElement | undefined;
let lastScrollFactor: number;

interface ScrollOptions {
	dir: "up" | "down" | "left" | "right";
	target: ElementWrapper | "page" | "leftAside" | "rightAside" | "repeatLast";
	factor?: number;
}

function getScrollBehavior() {
	// Scroll tests fail if behavior is "smooth"
	if (process.env["NODE_ENV"] !== "production") return "instant";

	const scrollBehavior = getCachedSetting("scrollBehavior");

	if (scrollBehavior === "auto") {
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		return !mediaQuery || mediaQuery.matches ? "instant" : "smooth";
	}

	return scrollBehavior;
}

/**
 * Since the scroll container could be spanning beyond the viewport we need
 * the rectangle that is actually intersecting the viewport
 */
function getIntersectionWithViewport(element: Element): DOMRect {
	const viewportHeight = window.innerHeight;
	const viewportWidth = window.innerWidth;

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

function isScrollable(
	element: HTMLElement,
	direction: "horizontal" | "vertical"
) {
	const { clientHeight, clientWidth, scrollHeight, scrollWidth } = element;
	const { overflowX, overflowY } = window.getComputedStyle(element);

	if (direction === "horizontal" && clientWidth !== scrollWidth) {
		if (element === document.documentElement) return true;

		if (
			element === document.body &&
			document.documentElement.clientWidth ===
				document.documentElement.scrollWidth
		) {
			return true;
		}

		if (/scroll|auto/.test(overflowX)) return true;
	}

	if (direction === "vertical" && clientHeight !== scrollHeight) {
		if (element === document.documentElement) return true;

		if (
			element === document.body &&
			document.documentElement.clientHeight ===
				document.documentElement.scrollHeight
		) {
			return true;
		}

		if (/scroll|auto/.test(overflowY)) return true;
	}

	return false;
}

function getScrollableAtCenter(direction: "horizontal" | "vertical") {
	const x = document.documentElement.clientWidth / 2;
	const y = document.documentElement.clientHeight / 2;

	let outerScrollable;

	let current = document.elementFromPoint(x, y);

	while (current) {
		if (current instanceof HTMLElement && isScrollable(current, direction)) {
			outerScrollable = current;
		}

		current = current.parentElement;
	}

	return outerScrollable;
}

function getLeftmostScrollable() {
	const scrollables = [...document.querySelectorAll("*")]
		.filter(isHtmlElement)
		.filter(
			(element) =>
				isScrollable(element, "vertical") && element.matches(":not(html, body)")
		);

	let leftScrollable;
	let leftScrollableRight;

	// The leftmost scrollable is the one whose right side is most to the left.
	// we compare that instead of the left side because another scrollable left
	// could be more to the left but, for example, span the whole viewport.
	for (const scrollable of scrollables) {
		// This finds instances of scrolling elements that don't really scroll. For
		// example, Slack left bar.
		if (scrollable.querySelectorAll("*").length < 5) continue;
		const { right } = scrollable.getBoundingClientRect();
		if (leftScrollableRight === undefined || right < leftScrollableRight) {
			leftScrollable = scrollable;
			leftScrollableRight = right;
		}
	}

	return leftScrollable;
}

function getRightmostScrollable() {
	const scrollables = [...document.querySelectorAll("*")]
		.filter(isHtmlElement)
		.filter(
			(element) =>
				element instanceof HTMLElement &&
				isScrollable(element, "vertical") &&
				element.matches(":not(html, body)")
		);

	let rightScrollable;
	let rightScrollableLeft;

	for (const scrollable of scrollables) {
		// This finds instances of scrolling elements that don't really scroll. For
		// example, Slack left bar.
		if (scrollable.querySelectorAll("*").length < 5) continue;
		const { left } = scrollable.getBoundingClientRect();
		if (rightScrollableLeft === undefined || left > rightScrollableLeft) {
			rightScrollable = scrollable;
			rightScrollableLeft = left;
		}
	}

	return rightScrollable;
}

export function snapScroll(
	position: "top" | "center" | "bottom",
	target: ElementWrapper
) {
	const scrollContainer = target.userScrollableContainer;

	if (!scrollContainer) {
		throw new Error("Couldn't find userScrollableContainer for element");
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

	let scrollAmount = 0;

	if (position === "top") {
		scrollAmount = isPageScroll ? top : top - cTop;
	}

	if (position === "center") {
		scrollAmount = center - cCenter;
	}

	if (position === "bottom") {
		scrollAmount = isPageScroll ? -(cHeight - bottom) : -(cBottom - bottom);
	}

	scrollContainer.scrollBy({
		left: 0,
		top: scrollAmount,
		behavior: getScrollBehavior(),
	});

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
					scrollContainer.scrollBy({
						left: 0,
						top: top - stickyBottom,
						behavior: getScrollBehavior(),
					});
					stickyFound = true;
					break;
				}
			}
		} while (stickyFound);
	}
}

export function scroll(options: ScrollOptions) {
	const { dir, target } = options;
	let factor = options.factor;
	let scrollContainer: HTMLElement | undefined;
	const direction =
		dir === "left" || dir === "right" ? "horizontal" : "vertical";

	if (target === "repeatLast" && (!lastScrollContainer || !lastScrollFactor)) {
		throw new Error("Unable to repeat the last scroll");
	}

	if (!(typeof target === "string")) {
		scrollContainer = getUserScrollableContainer(target.element, direction);
		if (!scrollContainer) {
			throw new Error("Couldn't find userScrollableContainer for element");
		}
	}

	if (target === "repeatLast") {
		scrollContainer = lastScrollContainer;
		factor = lastScrollFactor;
	}

	// Page scroll
	if (target === "page") {
		if (isScrollable(document.documentElement, direction)) {
			scrollContainer = document.documentElement;
		} else if (isScrollable(document.body, direction)) {
			scrollContainer = document.body;
		} else {
			scrollContainer = getScrollableAtCenter(direction);
		}
	}

	if (target === "leftAside") {
		scrollContainer = getLeftmostScrollable();
	}

	if (target === "rightAside") {
		scrollContainer = getRightmostScrollable();
	}

	if (!scrollContainer) {
		throw new Error("No element found to scroll");
	}

	const containerRect = getIntersectionWithViewport(scrollContainer);
	const { width: scrollWidth, height: scrollHeight } = containerRect;

	let left = 0;
	let top = 0;
	factor ??= DEFAULT_SCROLL_FACTOR;

	// We store the values for future use
	lastScrollContainer = scrollContainer;
	lastScrollFactor = factor;

	if (dir === "up") top = -scrollHeight * factor;
	if (dir === "down") top = scrollHeight * factor;
	if (dir === "left") left = -scrollWidth * factor;
	if (dir === "right") left = scrollWidth * factor;

	scrollContainer.scrollBy({ left, top, behavior: getScrollBehavior() });
}
