export function getUserScrollableContainer(element: Element): HTMLElement {
	const elementPosition = window.getComputedStyle(element).position;

	let current: Element | null = element;

	while (current) {
		const { position, overflowX, overflowY } = window.getComputedStyle(current);
		const { scrollWidth, clientWidth, scrollHeight, clientHeight } = current;

		// If the element is position: absolute we need to ignore any element with
		// position: static as our element won't scroll with that container
		if (elementPosition === "absolute" && position === "static") {
			current = current.parentElement;
			continue;
		}

		if (
			current instanceof HTMLElement &&
			((scrollWidth > clientWidth && /scroll|auto/.test(overflowX)) ||
				(scrollHeight > clientHeight && /scroll|auto/.test(overflowY)))
		) {
			return current;
		}

		current = current.parentElement;
	}

	return document.documentElement;
}
