import { getScrollContainer } from "../utils/getScrollContainer";

let scrollContainer: HTMLElement | undefined;
let lastScrollFactor: number;

function isPageScroll(container: Element) {
	return container === document.body || container === document.documentElement;
}

function scrollVerticallyAmount(
	scrollContainer: HTMLElement,
	scrollAmount: number
) {
	const previousScrollBehavior =
		window.getComputedStyle(scrollContainer).scrollBehavior;
	scrollContainer.style.scrollBehavior = "auto";

	scrollContainer.scrollBy({ left: 0, top: scrollAmount, behavior: "auto" });
	scrollContainer.style.scrollBehavior = previousScrollBehavior;
}

function scrollVertically(
	scrollContainer: HTMLElement,
	direction: "up" | "down",
	scrollFactor: number
) {
	lastScrollFactor = scrollFactor;
	const scrollHeight = Math.min(
		scrollContainer.clientHeight,
		document.documentElement.clientHeight
	);
	const scrollAmount =
		direction === "up"
			? -scrollHeight * scrollFactor
			: scrollHeight * scrollFactor;

	scrollVerticallyAmount(scrollContainer, scrollAmount);
}

export function scrollVerticallyAtElement(
	direction: "up" | "down",
	element: Element,
	scrollFactor?: number
) {
	scrollFactor = scrollFactor ?? lastScrollFactor ?? 0.66;
	scrollContainer = getScrollContainer(element);

	if (scrollContainer) {
		scrollVertically(scrollContainer, direction, scrollFactor);
	}
}

function getElementVisibleRect(element: Element): DOMRect {
	const rect = element.getBoundingClientRect();
	const viewportHeight = document.documentElement.clientHeight;
	const viewportWidth = document.documentElement.clientWidth;
	const elementTop = Math.max(0, rect.top);
	const elementBottom = Math.min(viewportHeight, rect.bottom);
	const elementLeft = Math.max(0, rect.left);
	const elementRight = Math.min(0, viewportWidth);
	return new DOMRect(
		elementLeft,
		elementTop,
		elementRight - elementLeft,
		elementBottom - elementTop
	);
}

export function scrollElementToTop(element: Element) {
	scrollContainer = getScrollContainer(element);

	if (scrollContainer) {
		const containerRect = getElementVisibleRect(scrollContainer);
		const elementTop = element.getBoundingClientRect().top;
		const scrollAmount = isPageScroll(scrollContainer)
			? elementTop
			: elementTop - containerRect.top;

		scrollVerticallyAmount(scrollContainer, scrollAmount);

		// After scrolling we need to check if were the element sits now there is a
		// sticky or fixed element obscuring the element. If that's the case we scroll
		// down the height of that sticky element
		const elementRect = element.getBoundingClientRect();
		const elementsAt = document.elementsFromPoint(
			elementRect.x + 5,
			elementRect.y + 5
		);
		let outerSticky;

		for (const elementAt of elementsAt) {
			if (elementAt === element || elementAt.contains(element)) {
				break;
			}

			const elementPosition = window.getComputedStyle(elementAt).position;
			if (
				(elementPosition === "sticky" || elementPosition === "fixed") &&
				(!outerSticky ||
					outerSticky.compareDocumentPosition(elementAt) === 4 || // ElementAt precedes outerSticky
					outerSticky.compareDocumentPosition(elementAt) === 10) // ElementAt precedes and contains outerSticky
			) {
				outerSticky = elementAt;
			}
		}

		if (outerSticky) {
			scrollVerticallyAmount(scrollContainer, -outerSticky.clientHeight);
		}
	}
}

export function scrollElementToBottom(element: Element) {
	scrollContainer = getScrollContainer(element);

	if (scrollContainer) {
		const containerRect = getElementVisibleRect(scrollContainer);
		const elementBottom = element.getBoundingClientRect().bottom;
		const scrollAmount = isPageScroll(scrollContainer)
			? scrollContainer.clientHeight - elementBottom
			: containerRect.bottom - elementBottom;

		scrollVerticallyAmount(scrollContainer, -scrollAmount);
	}
}

export function scrollElementToCenter(element: Element) {
	scrollContainer = getScrollContainer(element);

	if (scrollContainer) {
		const containerRect = getElementVisibleRect(scrollContainer);
		const containerCenter = isPageScroll(scrollContainer)
			? scrollContainer.clientHeight / 2
			: containerRect.top + containerRect.height / 2;
		const elementCenter =
			element.getBoundingClientRect().top + element.clientHeight / 2;
		const scrollAmount =
			Math.max(containerCenter, elementCenter) -
			Math.min(containerCenter, elementCenter);

		// If the container center is greater than the element center, that means that
		// the element is below the center of the container. In that case the scroll
		// amount needs to be negative to move the element upwards.
		if (containerCenter > elementCenter) {
			scrollVerticallyAmount(scrollContainer, -scrollAmount);
		} else {
			scrollVerticallyAmount(scrollContainer, scrollAmount);
		}
	}
}

export function scrollPageVertically(
	direction: "up" | "down",
	scrollAmount = 0.66
) {
	const scrollContainer =
		document.documentElement.clientHeight ===
		document.documentElement.scrollHeight
			? document.body
			: document.documentElement;

	scrollVertically(scrollContainer, direction, scrollAmount);
}
