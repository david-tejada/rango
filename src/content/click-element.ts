import browser from "webextension-polyfill";
import { focusesOnclick } from "../lib/dom-utils";
import { applyEmphasisStyles, applyInitialStyles } from "../lib/styles";
import { intersectors } from "./intersectors";
import { displayHints } from "./hints";

export function clickElementByHint(
	hintText: string,
	newTab: boolean,
	mouseEventInit?: MouseEventInit
) {
	const target = intersectors.find(
		(intersector) => intersector.hintText === String(hintText)
	);

	if (target) {
		applyEmphasisStyles(target);
		if (focusesOnclick(target.element)) {
			setTimeout(() => {
				applyInitialStyles(target);
			}, 300);
			(target.element as HTMLInputElement).focus();
		} else {
			if (
				target.element.tagName === "A" &&
				(newTab || target.element.getAttribute("target") === "_blank")
			) {
				browser.runtime
					.sendMessage({
						action: "openInNewTab",
						url: (target.element as HTMLLinkElement).href,
					})
					.catch((error) => {
						console.log(error);
					});
			} else {
				const event = new MouseEvent("click", mouseEventInit);
				target.element.dispatchEvent(event);
			}

			// On some pages like codepen there are hints remaining after closing a popup panel.
			// This is not a perfect solution but as long as the user clicks with voice I think we're safe
			displayHints(intersectors);
		}
	}
}
