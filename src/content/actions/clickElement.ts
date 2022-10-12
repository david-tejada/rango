import { focusesOnclick } from "../utils/focusesOnclick";
import { ElementWrapper } from "../wrappers";
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

export async function clickElement(wrappers: ElementWrapper[]) {
	// If there are multiple targets and some of them are anchor elements we open
	// those in a new background tab
	if (wrappers.length > 1) {
		const anchorWrappers = wrappers.filter(
			(hintable) => hintable.element instanceof HTMLAnchorElement
		);
		wrappers = wrappers.filter(
			(hintable) => !(hintable.element instanceof HTMLAnchorElement)
		);
		await openInBackgroundTab(anchorWrappers);
	}

	for (const wrapper of wrappers) {
		const element = wrapper.clickTarget;
		wrapper.hint?.flash();
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
				void openInNewTab([wrapper]);
			} else {
				dispatchClick(element);
			}
		} else {
			dispatchClick(element);
		}
	}
}
