// This function retrieves all Elements starting from origin, including those
// inside shadow DOMs or even nested shadow DOMs
export function getAllElements(origin: Element): Element[] {
	const result = [origin];
	const elements = origin.shadowRoot
		? [...origin.shadowRoot.querySelectorAll("*")]
		: [...origin.querySelectorAll("*")];

	for (const element of elements) {
		if (element.shadowRoot) {
			result.push(...getAllElements(element));
		} else {
			result.push(element);
		}
	}

	return result;
}
