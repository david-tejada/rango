import { intersectingElements } from "./intersecting-elements";
import { displayHints } from "./hints";

export function clickElementByHint(hintNumber: number) {
	const target = intersectingElements.find(
		(intersectingElement) => intersectingElement.hintText === String(hintNumber)
	);
	if (target && target.element.tagName === "INPUT") {
		(target.element as HTMLInputElement).focus();
	} else if (target) {
		clickElement(target.element as HTMLElement);
	}
}

function clickElement(element: HTMLElement) {
	const previousOutline = element.style.outline;
	element.style.outline = "#247881 solid 2px";
	setTimeout(() => {
		element?.click();
		element.style.outline = previousOutline;
		// On some pages like codepen there are hints remaining after closing a popup panel.
		// This is not a perfect solution but as long as the user clicks with voice I think we're safe
		displayHints(intersectingElements);
	}, 200);
}
