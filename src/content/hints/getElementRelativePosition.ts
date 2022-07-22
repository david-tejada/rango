// Get the element position relative to an ascendant.
export function getElementRelativePosition(
	element: HTMLElement,
	container: HTMLElement
) {
	let left = 0;
	let top = 0;
	let current: Element | null = element;

	while (current && current instanceof HTMLElement && current !== container) {
		left += current.offsetLeft;
		top += current.offsetTop;
		current = current.offsetParent;
	}

	return [left, top];
}
