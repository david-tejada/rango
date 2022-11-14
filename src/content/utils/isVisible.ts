export function isVisible(element: Element): boolean {
	const { visibility, opacity } = window.getComputedStyle(element);
	const { width, height } = element.getBoundingClientRect();

	if (visibility === "hidden" || width < 5 || height < 5 || opacity === "0") {
		return false;
	}

	// Check if an element is hidden by a close ancestor having opacity: 0
	let current = element.parentElement;
	let counter = 0;

	while (current && counter < 3) {
		const { opacity } = window.getComputedStyle(current);
		if (opacity === "0") {
			return false;
		}

		current = current.parentElement;
		counter++;
	}

	return true;
}
