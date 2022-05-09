import browser from "webextension-polyfill";
import { displayHints } from "./hints";

export async function toggleHints() {
	const localStorage = await browser.storage.local.get(["showHints"]);
	let showHints = localStorage["showHints"] as boolean;

	showHints = !showHints;
	await browser.storage.local.set({ showHints });

	if (showHints) {
		await displayHints();
	} else {
		await displayHints([]);
		document.querySelector("#rango-hints-container")?.remove();
	}
}
