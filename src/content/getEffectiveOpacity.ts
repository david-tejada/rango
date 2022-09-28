export function getEffectiveOpacity(element: Element): number {
	let cumulativeOpacity = 1;
	let current: Element | null = element;
	while (current) {
		cumulativeOpacity *= Number.parseFloat(
			window.getComputedStyle(current).opacity
		);
		current = current.parentElement;
	}

	return cumulativeOpacity;
}
