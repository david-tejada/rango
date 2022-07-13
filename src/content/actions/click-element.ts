import { parseDomain, ParseResultType, fromUrl } from "parse-domain";
import { focusesOnclick } from "../utils/clickable-type";
import { flashHint } from "../hints/styles";
import { triggerHintsUpdate } from "../hints/display-hints";
import { HintedIntersector } from "../../typing/types";
import { openInBackgroundTab, openInNewTab } from "./open-in-new-tab";

function getMainDomain(url: string): string | undefined {
	const parseResult = parseDomain(fromUrl(url));

	// Check if the domain is listed in the public suffix list
	if (parseResult.type === ParseResultType.Listed) {
		const { domain, topLevelDomains } = parseResult;

		const topLevel = topLevelDomains.join(".");
		return `${domain!}.${topLevel}`;
	}

	return undefined;
}

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
