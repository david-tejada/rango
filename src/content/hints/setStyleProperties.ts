// This function makes sure the properties we apply to our elements don't
// get overridden by any stylesheet
export function setStyleProperties(
	element: HTMLElement,
	properties: Record<string, string>
) {
	for (const [property, value] of Object.entries(properties)) {
		element.style.setProperty(property, value, "important");
	}
}
