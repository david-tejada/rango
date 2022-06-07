import { parseDomain, ParseResultType, fromUrl } from "parse-domain";
import { focusesOnclick } from "./clickable-type";
import { flashHint } from "./styles";
import { getIntersectorWithHint } from "./intersectors";
import { triggerHintsUpdate } from "./hints";
import { openInNewTab } from "./open-in-new-tab";

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

export async function clickElement(hintText: string) {
	const intersector = getIntersectorWithHint(hintText);

	if (intersector) {
		flashHint(intersector);
		if (focusesOnclick(intersector.element)) {
			(
				intersector.element as
					| HTMLInputElement
					| HTMLSelectElement
					| HTMLTextAreaElement
			).focus();
		} else {
			if (intersector.element.tagName === "A") {
				const linkElement = intersector.element as HTMLLinkElement;
				// Sometimes websites use links with target="_blank" but don't open a new tab.
				// They probably prevent the default behavior with javascript. For example Slack
				// has this for opening a thread in the side panel. So here we make sure that
				// if the main domains are equal just do a normal click and let the page handle it
				const linkMainDomain = getMainDomain(linkElement.href);
				const locationMainDomain = getMainDomain(window.location.href);
				if (
					linkElement.getAttribute("target") === "_blank" &&
					linkMainDomain !== locationMainDomain
				) {
					await openInNewTab(intersector);
				} else {
					linkElement.click();
				}
			} else {
				(intersector.element as HTMLElement).click();
			}

			// On some pages like codepen there are hints remaining after closing a popup panel.
			// This is not a perfect solution but as long as the user clicks with voice I think we're safe
			await triggerHintsUpdate();
		}
	}
}
