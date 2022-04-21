import { intersectingElements } from "./intersecting-elements";
import { displayHints } from "./hints";

export function clickElementByHint(hintText: string) {
	const target = intersectingElements.find(
		(intersectingElement) => intersectingElement.hintText === String(hintText)
	);
	if (
		target &&
		target.element.tagName === "INPUT" &&
		(target.element.getAttribute("type") === "text" ||
			target.element.getAttribute("type") === "search")
	) {
		(target.element as HTMLInputElement).focus();
	} else if (target) {
		target.hintElement?.classList.add("rango-clicked-hint");
		(target.element as HTMLElement).click();
		// On some pages like codepen there are hints remaining after closing a popup panel.
		// This is not a perfect solution but as long as the user clicks with voice I think we're safe
		displayHints(intersectingElements);
	}
}
