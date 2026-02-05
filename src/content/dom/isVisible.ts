import { getBoundingClientRect, getCachedStyle } from "../hints/layoutCache";

export function isVisible(element: Element): boolean {
	const { visibility, opacity } = getCachedStyle(element);
	const { width, height } = getBoundingClientRect(element);

	if (visibility === "hidden" || width < 5 || height < 5 || opacity === "0") {
		// This handles custom checkboxes or radio buttons where the input element
		// is hidden and replaced with a stylized sibling.
		if (
			element instanceof HTMLInputElement &&
			(element.type === "checkbox" || element.type === "radio") &&
			element.parentElement &&
			isVisible(element.parentElement)
		) {
			return true;
		}

		return false;
	}

	// Check if an element is hidden by a close ancestor having opacity: 0.
	// Checking all the ancestors can take a significant amount of time (~50ms).
	// Doing some research it seems like when a hintable element is hidden by an
	// ancestor with an opacity of 0 it's usually the first or second ancestor.
	// Checking four ancestors only adds about 10ms to 15ms. If in some rare case
	// the ancestor with the opacity of 0 is beyond that is probably that the hint
	// would be within that ancestor, so it would also remain hidden.
	let current = element.parentElement;
	let counter = 0;

	while (current && counter < 4) {
		const { opacity } = getCachedStyle(current);
		if (opacity === "0") {
			return false;
		}

		current = current.parentElement;
		counter++;
	}

	return true;
}
