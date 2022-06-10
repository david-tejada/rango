import browser from "webextension-polyfill";
import { Intersector } from "../../typing/types";
import { isHintedIntersector } from "../../typing/typing-utils";
import { getIntersectorWithHint } from "../intersectors";
import { flashHint } from "../hints/styles";

export async function openInNewTab(hintOrIntersector: string | Intersector) {
	const intersector =
		typeof hintOrIntersector === "string"
			? getIntersectorWithHint(hintOrIntersector)
			: hintOrIntersector;
	if (isHintedIntersector(intersector)) {
		flashHint(intersector);
		await browser.runtime.sendMessage({
			type: "openInNewTab",
			url: (intersector.element as HTMLLinkElement).href,
		});
	}
}

export async function openInBackgroundTab(hints: string[]) {
	const links = [];
	const intersectors = [];
	for (const hint of hints) {
		const intersector = getIntersectorWithHint(hint);
		if (intersector.element instanceof HTMLAnchorElement) {
			intersectors.push(intersector);
			links.push(intersector.element.href);
		}
	}

	if (links.length > 0) {
		for (const intersector of intersectors) {
			if (isHintedIntersector(intersector)) {
				flashHint(intersector);
			}
		}

		await browser.runtime.sendMessage({
			type: "openInBackgroundTab",
			links,
		});
	}
}
