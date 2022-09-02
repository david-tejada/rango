import { focusesOnclick } from "../utils/isClickable";
import { Hintable } from "../Hintable";
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

export async function clickElement(hintables: Hintable[]) {
	// If there are multiple targets and some of them are anchor elements we open
	// those in a new background tab
	if (hintables.length > 1) {
		const anchorHintables = hintables.filter(
			(hintable) => hintable.element instanceof HTMLAnchorElement
		);
		hintables = hintables.filter(
			(hintable) => !(hintable.element instanceof HTMLAnchorElement)
		);
		await openInBackgroundTab(anchorHintables);
	}

	for (const hintable of hintables) {
		const element = hintable.element;
		hintable.hint?.flash();
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
				void openInNewTab([hintable]);
			} else {
				dispatchClick(element);
			}
		} else {
			dispatchClick(element);
		}
	}
}
