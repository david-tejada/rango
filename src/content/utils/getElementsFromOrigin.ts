// This function retrieves all Elements starting from origin, including those
// inside shadow DOMs or even nested shadow DOMs
export function getElementsFromOrigin(
	origin: Element,
	getOrigin = true
): Element[] {
	const result = getOrigin ? [origin] : [];
	const elements = origin.shadowRoot
		? [
				...origin.shadowRoot.querySelectorAll(
					":not(.rango-hint-wrapper, .rango-hint, #rango-copy-paste-area)"
				),
		  ]
		: [
				...origin.querySelectorAll(
					":not(.rango-hint-wrapper, .rango-hint, #rango-copy-paste-area)"
				),
		  ];

	for (const element of elements) {
		if (element.shadowRoot) {
			result.push(...getElementsFromOrigin(element));
		} else {
			result.push(element);
		}
	}

	return result;
}
