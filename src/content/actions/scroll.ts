import { getIntersectorWithHint } from "../intersectors";

let scrollContainer: HTMLElement | undefined;

function isPageScroll(container: Element) {
	return container === document.body || container === document.documentElement;
}

function getScrollContainer(
	node: Node | null, // eslint-disable-line @typescript-eslint/ban-types
	sticky = false
): HTMLElement | undefined {
	if (node instanceof HTMLElement) {
		if (
			node === document.body &&
			document.documentElement.clientHeight !==
				document.documentElement.scrollHeight
		) {
			return sticky ? undefined : document.documentElement;
		}

		if (
			node.scrollHeight > node.clientHeight &&
			(window.getComputedStyle(node).overflowY === "auto" ||
				window.getComputedStyle(node).overflowY === "scroll")
		) {
			return node;
		}

		// This is here to avoid scrolling when the element selected can't move
		if (
			window.getComputedStyle(node).position === "sticky" ||
			window.getComputedStyle(node).position === "fixed"
		) {
			sticky = true;
		}

		if (node.parentNode) {
			return getScrollContainer(node.parentNode, sticky);
		}
	}

	return undefined;
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
	direction: "up" | "down"
) {
	const scrollHeight = Math.min(
		scrollContainer.clientHeight,
		document.documentElement.clientHeight
	);
	const scrollAmount =
		direction === "up" ? (-scrollHeight * 2) / 3 : (scrollHeight * 2) / 3;

	scrollVerticallyAmount(scrollContainer, scrollAmount);
}

export function scrollVerticallyAtElement(
	direction: "up" | "down",
	hint?: string
) {
	if (hint) {
		const element = getIntersectorWithHint(hint).element;
		scrollContainer = getScrollContainer(element);
	}

	if (scrollContainer) {
		scrollVertically(scrollContainer, direction);
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

function getStickyHeaderHeight(): number {
	const elements = document.body.querySelectorAll("div, header, nav");
	const stickyHeights = [];
	for (const element of elements) {
		const style = window.getComputedStyle(element);
		if (
			(style.position === "fixed" || style.position === "sticky") &&
			Number.parseInt(style.top, 10) === 0 &&
			element.clientWidth > element.clientHeight
		) {
			stickyHeights.push(element.scrollHeight);
		}
	}

	return Math.max(0, ...stickyHeights);
}

export function scrollElementToTop(hint: string) {
	const element = getIntersectorWithHint(hint).element;
	scrollContainer = getScrollContainer(element);

	if (scrollContainer) {
		const containerRect = getElementVisibleRect(scrollContainer);
		const elementTop = element.getBoundingClientRect().top;
		const stickyHeight = getStickyHeaderHeight();
		const scrollAmount = isPageScroll(scrollContainer)
			? elementTop - stickyHeight
			: elementTop - containerRect.top;

		scrollVerticallyAmount(scrollContainer, scrollAmount);

		// After scrolling we check again for sticky headers in case they were added with javascript
		if (stickyHeight === 0) {
			setTimeout(() => {
				if (scrollContainer && isPageScroll(scrollContainer)) {
					scrollVerticallyAmount(scrollContainer, -getStickyHeaderHeight());
				}
			}, 0);
		}
	}
}

export function scrollElementToBottom(hint: string) {
	const element = getIntersectorWithHint(hint).element;
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

export function scrollElementToCenter(hint: string) {
	const element = getIntersectorWithHint(hint).element;
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

export function scrollPageVertically(direction: "up" | "down") {
	const scrollContainer =
		document.documentElement.clientHeight ===
		document.documentElement.scrollHeight
			? document.body
			: document.documentElement;

	scrollVertically(scrollContainer, direction);
}
