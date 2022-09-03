export function getScrollContainer(
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
