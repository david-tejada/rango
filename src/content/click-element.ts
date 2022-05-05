import browser from "webextension-polyfill";
import { parseDomain, ParseResultType, fromUrl } from "parse-domain";
import { focusesOnclick } from "../lib/dom-utils";
import { applyEmphasisStyles, applyInitialStyles } from "../lib/styles";
import { intersectors } from "./intersectors";
import { displayHints } from "./hints";

export async function clickElement(
	hintText: string,
	newTab: boolean,
	mouseEventInit?: MouseEventInit
) {
	const target = intersectors.find(
		(intersector) => intersector.hintText === String(hintText)
	);

	if (target) {
		applyEmphasisStyles(target, true);
		if (focusesOnclick(target.element)) {
			setTimeout(() => {
				applyInitialStyles(target);
			}, 300);
			(target.element as HTMLInputElement).focus();
		} else {
			// Sometimes websites use links with target="_blank" but don't open a new tab.
			// They probably prevent the default behavior with javascript. For example Slack
			// has this for opening a thread in the side panel. So here we make sure that
			// if the main domains are equal just do a normal click and let the page handle it
			const linkMainDomain = getMainDomain(
				(target.element as HTMLLinkElement).href
			);
			const locationMainDomain = getMainDomain(window.location.href);
			if (
				target.element.tagName === "A" &&
				(newTab ||
					(target.element.getAttribute("target") === "_blank" &&
						linkMainDomain !== locationMainDomain &&
						(target.element as HTMLLinkElement).href &&
						(target.element as HTMLLinkElement).href !== location.href))
			) {
				browser.runtime
					.sendMessage({
						type: "request",
						action: {
							type: "openInNewTab",
							target: (target.element as HTMLLinkElement).href,
						},
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
			await displayHints(intersectors);
		}
	}
}

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
