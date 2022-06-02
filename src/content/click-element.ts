import browser from "webextension-polyfill";
import { parseDomain, ParseResultType, fromUrl } from "parse-domain";
import { focusesOnclick } from "../lib/dom-utils";
import { applyEmphasisStyles, applyInitialStyles } from "./styles";
import { intersectors } from "./intersectors";
import { triggerHintsUpdate } from "./hints";

export async function clickElement(hintText: string, newTab: boolean) {
	const target = intersectors.find(
		(intersector) => intersector.hintText === String(hintText)
	);

	if (target) {
		applyEmphasisStyles(target, true);
		setTimeout(() => {
			applyInitialStyles(target).catch((error) => {
				console.error(error);
			});
		}, 300);
		if (focusesOnclick(target.element)) {
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
				await browser.runtime.sendMessage({
					type: "openInNewTab",
					url: (target.element as HTMLLinkElement).href,
				});
			} else {
				console.log("Clicking");
				(target.element as HTMLElement).click();
			}

			// On some pages like codepen there are hints remaining after closing a popup panel.
			// This is not a perfect solution but as long as the user clicks with voice I think we're safe
			await triggerHintsUpdate();
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
