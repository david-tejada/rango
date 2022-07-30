export function getScrollContainer(element: HTMLElement): HTMLElement | null {
	let current: HTMLElement | null = element;

	while (current) {
		if (
			current === document.body &&
			document.documentElement.clientHeight !==
				document.documentElement.scrollHeight
		) {
			return document.documentElement;
		}

		const style = window.getComputedStyle(current);

		if (
			current.scrollHeight > current.clientHeight &&
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
