import browser from "webextension-polyfill";
import { Intersector } from "../typing/types";
import { getIntersectorWithHint } from "./intersectors";
import { flashHint } from "./styles";

export async function openInNewTab(hintOrIntersector: string | Intersector) {
	const intersector =
		typeof hintOrIntersector === "string"
			? getIntersectorWithHint(hintOrIntersector)
			: hintOrIntersector;
	if (intersector) {
		flashHint(intersector);
		await browser.runtime.sendMessage({
			type: "openInNewTab",
			url: (intersector.element as HTMLLinkElement).href,
		});
	}
}
