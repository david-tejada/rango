import { focusesOnclick } from "../lib/dom-utils";
import { applyEmphasisStyles, applyInitialStyles } from "../lib/styles";
import { intersectingElements } from "./intersecting-elements";
import { displayHints } from "./hints";

export function clickElementByHint(hintText: string) {
	const target = intersectingElements.find(
		(intersectingElement) => intersectingElement.hintText === String(hintText)
	);

	if (target) {
		applyEmphasisStyles(target);
		if (focusesOnclick(target.element)) {
			setTimeout(() => {
				applyInitialStyles(target);
			}, 300);
			(target.element as HTMLInputElement).focus();
		} else {
			(target.element as HTMLElement).click();
			// On some pages like codepen there are hints remaining after closing a popup panel.
			// This is not a perfect solution but as long as the user clicks with voice I think we're safe
			displayHints(intersectingElements);
		}
	}
}
