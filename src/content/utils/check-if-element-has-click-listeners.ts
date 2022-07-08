function isValidCssName(name: string): boolean {
	return /^-?[_a-zA-Z]+[\w-]*$/.test(name);
}

function getIdSelector(element: Element): string {
	if (isValidCssName(element.id)) {
		return `#${element.id}`;
	}

	return "";
}

function getClassSelector(element: Element): string {
	const classList = element.classList;
	const validClasses = [];

	for (const className of classList) {
		if (isValidCssName(className)) {
			validClasses.push(className);
		}
	}

	return validClasses.length > 0 ? `.${validClasses.join(".")}` : "";
}

export function getElementSelector(element: Element, ancestors = 2): string {
	const currentElementSelector =
		element.tagName.toLowerCase() +
		getIdSelector(element) +
		getClassSelector(element);

	if (ancestors === 0) {
		return currentElementSelector;
	}

	if (element.parentElement) {
		return (
			getElementSelector(element.parentElement, ancestors - 1) +
			" > " +
			currentElementSelector
		);
	}

	return currentElementSelector;
}

const checkedSelectors = new Set();

export function checkIfElementHasClickListeners(element: Element) {
	if (window.getComputedStyle(element).cursor !== "pointer") {
		return;
	}

	const selector = getElementSelector(element);
	if (!checkedSelectors.has(selector)) {
		checkedSelectors.add(selector);
		window.postMessage(
			{
				type: "checkIfElementHasClickListeners",
				selector,
			},
			window.location.href
		);
	}
}
