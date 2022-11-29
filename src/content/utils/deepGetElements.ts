// This function retrieves all Elements starting from root, including those
// inside shadow DOMs or even nested shadow DOMs
export function deepGetElements(
	root: Element,
	includeRoot = true,
	selector = ":not(.rango-hint-wrapper, .rango-hint, #rango-copy-paste-area)"
): Element[] {
	const result = includeRoot ? [root] : [];
	const elements = root.shadowRoot
		? [...root.shadowRoot.querySelectorAll("*")]
		: [...root.querySelectorAll("*")];

	for (const element of elements) {
		if (element.shadowRoot) {
			result.push(...deepGetElements(element));
		} else {
			result.push(element);
		}
	}

	return result.filter((element) => element.matches(selector));
}
