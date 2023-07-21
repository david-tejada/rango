const customNudges = new Map<string, Array<[string, [number, number]]>>();

// OneNote hints being partially hidden. Issue #151.
customNudges.set("onenote.officeapps.live.com", [
	[".navItem.sectionItem", [8, 0]],
]);

/**
 * Gets a custom nudge (hint position adjustment) for a given DOM element.
 *
 * @param element The target element for the hint
 * @returns A tupple [left, top] with the pixel values that the hint needs to be nudged
 */
export function getCustomNudge(element: Element): [number, number] {
	const nudgesForHost = customNudges.get(window.location.host);

	const nudgeForSelector = nudgesForHost?.find(([selector]) =>
		element.matches(selector)
	)?.[1];

	return nudgeForSelector ?? [0, 0];
}
