import browser from "webextension-polyfill";
import { HintedIntersector } from "../../typing/types";
import { assertDefined } from "../../typing/typing-utils";
import { flashHint } from "../hints/styles";

export async function openInNewTab(intersectors: HintedIntersector[]) {
	const first = intersectors[0];
	const rest = intersectors.slice(1);

	assertDefined(first);
	flashHint(first);
	if (first.element instanceof HTMLAnchorElement) {
		void browser.runtime.sendMessage({
			type: "openInNewTab",
			url: first.element.href,
		});
	}

	if (rest.length > 0) {
		void openInBackgroundTab(rest);
	}
}

export async function openInBackgroundTab(intersectors: HintedIntersector[]) {
	const links = [];
	const anchorIntersectors = [];

	for (const intersector of intersectors) {
		if (intersector.element instanceof HTMLAnchorElement) {
			anchorIntersectors.push(intersector);
			links.push(intersector.element.href);
		}
	}

	if (links.length > 0) {
		for (const intersector of anchorIntersectors) {
			flashHint(intersector);
		}

		await browser.runtime.sendMessage({
			type: "openInBackgroundTab",
			links,
		});
	}
}
