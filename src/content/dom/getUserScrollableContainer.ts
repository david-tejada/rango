const containersCache = new Map<Element, HTMLElement>();

/**
 * Given an Element return the Element that contains it and might scroll it. It
 * doesn't necessarily mean that the container scrolls, but if it does, the
 * given element would scroll with it.
 */
export function getUserScrollableContainer(
	element: Element,
	axis?: "vertical" | "horizontal"
) {
	const elementPosition = getComputedStyle(element).position;

	const checked: Element[] = [];
	let current: Element | null = element;

	while (current) {
		const cached = containersCache.get(current);
		if (cached) return cached;

		const { position, overflowX, overflowY } = getComputedStyle(current);
		const { scrollWidth, clientWidth, scrollHeight, clientHeight } = current;

		if (position === "fixed") {
			return current;
		}

		// If the element is position: absolute we need to ignore any element with
		// position: static as our element won't scroll with that container
		if (elementPosition === "absolute" && position === "static") {
			current = current.parentElement;
			continue;
		}

		if (
			current === document.body &&
			scrollWidth === document.documentElement.scrollWidth &&
			scrollHeight === document.documentElement.scrollHeight
		) {
			checked.push(current);
			current = current.parentElement;
			continue;
		}

		const isHorizontallyScrollable =
			(!axis || axis === "horizontal") &&
			scrollWidth > clientWidth &&
			/scroll|auto/.test(overflowX);

		const isVerticallyScrollable =
			(!axis || axis === "vertical") &&
			scrollHeight > clientHeight &&
			/scroll|auto/.test(overflowY);

		if (
			current instanceof HTMLElement &&
			(isHorizontallyScrollable || isVerticallyScrollable)
		) {
			checked.push(current);

			// Cache the scrollable container for all checked elements
			for (const element of checked) {
				containersCache.set(element, current);
			}

			return current;
		}

		checked.push(current);
		current = current.parentElement;
	}

	for (const element of checked) {
		containersCache.set(element, document.documentElement);
	}

	return document.documentElement;
}
