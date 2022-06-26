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

export function scrollElementToTop(hint: string) {
	const element = getIntersectorWithHint(hint).element;
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
