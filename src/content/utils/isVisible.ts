export function isVisible(element: HTMLElement): boolean {
	const style = window.getComputedStyle(element);
	const rect = element.getBoundingClientRect();

	if (
		style.visibility === "hidden" ||
		Number.parseFloat(style.opacity) < 0.1 ||
		rect.width < 5 ||
		rect.height < 5
	) {
		return false;
	}

	if (element.offsetParent === null && style.position !== "fixed") {
		return false;
	}

	return true;
}
