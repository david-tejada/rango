export function isVisible(element: Element): boolean {
	const { visibility, opacity } = window.getComputedStyle(element);
	const { width, height } = element.getBoundingClientRect();

	if (
		visibility === "hidden" ||
		width < 5 ||
		height < 5 ||
		/**
		 * An element could still be hidden if an ancestor has an opacity set but
		 * because elements hidden this way are still clickable I don't think
		 * we should worry too much about it
		 */
		Number.parseFloat(opacity) < 0.1
	) {
		return false;
	}

	return true;
}
