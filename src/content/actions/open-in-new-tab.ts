import browser from "webextension-polyfill";
import { HintedIntersector } from "../../typing/types";
import { getIntersectorWithHint } from "../intersectors";
import { flashHint } from "../hints/styles";

export async function openInNewTab(
	hintOrIntersector: string | HintedIntersector
) {
	const intersector =
		typeof hintOrIntersector === "string"
			? getIntersectorWithHint(hintOrIntersector)
			: hintOrIntersector;
	flashHint(intersector);
	await browser.runtime.sendMessage({
		type: "openInNewTab",
		url: (intersector.element as HTMLLinkElement).href,
	});
}

export async function openInBackgroundTab(hints: string | string[]) {
	const links = [];
	const intersectors = [];
	if (typeof hints === "string") {
		hints = [hints];
	}

	for (const hint of hints) {
		const intersector = getIntersectorWithHint(hint);
		if (intersector.element instanceof HTMLAnchorElement) {
			intersectors.push(intersector);
			links.push(intersector.element.href);
		}
	}

	if (links.length > 0) {
		for (const intersector of intersectors) {
			flashHint(intersector);
		}

		await browser.runtime.sendMessage({
			type: "openInBackgroundTab",
			links,
		});
	}
}
