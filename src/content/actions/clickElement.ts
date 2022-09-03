import { focusesOnclick } from "../utils/getClickableType";
import { flashHint } from "../hints/applyInitialStyles";
import { triggerHintsUpdate } from "../hints/triggerHintsUpdate";
import { HintedIntersector } from "../../typings/Intersector";
import { openInBackgroundTab, openInNewTab } from "./openInNewTab";

function dispatchClick(element: Element) {
	const mousedownEvent = new MouseEvent("mousedown", {
		view: window,
		bubbles: true,
		cancelable: true,
	});
	const mouseupEvent = new MouseEvent("mouseup", {
		view: window,
		bubbles: true,
		cancelable: true,
	});
	const clickEvent = new MouseEvent("click", {
		view: window,
		bubbles: true,
		cancelable: true,
	});
	element.dispatchEvent(mousedownEvent);
	element.dispatchEvent(mouseupEvent);
	element.dispatchEvent(clickEvent);
}

export async function clickElement(intersectors: HintedIntersector[]) {
	// If there are multiple targets and some of them are anchor elements we open
	// those in a new background tab
	if (intersectors.length > 1) {
		const anchorIntersectors = intersectors.filter(
			(intersector) => intersector.element instanceof HTMLAnchorElement
		);
		intersectors = intersectors.filter(
			(intersector) => !(intersector.element instanceof HTMLAnchorElement)
		);
		await openInBackgroundTab(anchorIntersectors);
	}

	for (const intersector of intersectors) {
		const element = intersector.element;
		flashHint(intersector);
		if (element instanceof HTMLElement && focusesOnclick(element)) {
			element.focus();
		} else if (element instanceof HTMLAnchorElement) {
			// In Firefox if we click a link with target="_blank" we get a popup message
			// saying "Firefox prevented this site from opening a popup". In order to
			// avoid that we open a new tab with the url of the href of the link.
			// Sometimes websites use links with target="_blank" but don't open a new tab.
			// They probably prevent the default behavior with javascript. For example Slack
			// has this for opening a thread in the side panel. So here we make sure that
			// there is a href attribute before we open the link in a new tab.
			if (
				element.getAttribute("target") === "_blank" &&
				element.getAttribute("href")
			) {
				void openInNewTab([intersector]);
			} else {
				dispatchClick(element);
			}
		} else {
			dispatchClick(element);
		}
	}

	// On some pages like codepen there are hints remaining after closing a popup panel.
	// This is not a perfect solution but as long as the user clicks with voice I think we're safe
	await triggerHintsUpdate();
}
