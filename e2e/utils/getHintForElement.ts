export function getHintForElement(element: Element) {
	if (element instanceof HTMLElement) {
		const hint = element.dataset["hint"];
		if (!hint) {
			throw new TypeError("Element doesn't have hint attached");
		}

		return hint;
	}

	throw new TypeError("Element doesn't have dataset property");
}
