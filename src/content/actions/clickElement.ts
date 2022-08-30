import { focusesOnclick } from "../utils/isClickable";
import { getMainDomain } from "../utils/getMainDomain";
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
			// Sometimes websites use links with target="_blank" but don't open a new tab.
			// They probably prevent the default behavior with javascript. For example Slack
			// has this for opening a thread in the side panel. So here we make sure that
			// if the main domains are equal just do a normal click and let the page handle it
			const linkMainDomain = getMainDomain(element.href);
			const locationMainDomain = getMainDomain(window.location.href);
			if (
				element.getAttribute("target") === "_blank" &&
				linkMainDomain !== locationMainDomain
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
