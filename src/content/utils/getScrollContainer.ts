export function getScrollContainer(element: Element): HTMLElement | null {
	let current: Element | null = element;

	while (current) {
		if (
			current === document.body &&
			(document.documentElement.clientHeight !==
				document.documentElement.scrollHeight ||
				document.documentElement.clientWidth !==
					document.documentElement.scrollWidth)
		) {
			return document.documentElement;
		}

		const style = window.getComputedStyle(current);

		if (
			current instanceof HTMLElement &&
			(current.scrollHeight > current.clientHeight ||
				current.scrollWidth > current.clientWidth) &&
			(style.overflowY === "auto" || style.overflowY === "scroll")
		) {
			return current;
		}

		if (
			window.getComputedStyle(current).position === "sticky" ||
			window.getComputedStyle(current).position === "fixed"
		) {
			return null;
		}

		current = current.parentElement;
	}

	return null;
}
