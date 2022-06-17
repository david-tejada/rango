import browser from "webextension-polyfill";
import { RangoOptions, DisplayHints } from "../typing/types";

const defaultOptions: RangoOptions = {
	hintFontSize: 10,
	displayHints: {
		global: true,
		tabs: {},
		hosts: {},
		paths: {},
	},
	hintWeight: "auto",
	hintStyle: "boxed",
	urlInTitle: true,
};

async function clearUnusedStacks() {
	const tabs = await browser.tabs.query({});
	const tabIds = new Set(tabs.map((tab) => tab.id));
	const storage = await browser.storage.local.get(null);
	const deletingStacks = [];
	for (const key in storage) {
		if (key.startsWith("hints-stack-")) {
			const stackTabId = Number.parseInt(key.replace("hints-stack-", ""), 10);
			if (!tabIds.has(stackTabId)) {
				deletingStacks.push(browser.storage.local.remove(key));
			}
		}
	}

	await Promise.all(deletingStacks);
}

export async function initStorage() {
	await clearUnusedStacks();
	const localStorage = await browser.storage.local.get([
		"hintFontSize",
		"displayHints",
	]);

	// We just need to check one property to see if the options are initialized
	if (localStorage["hintFontSize"] === undefined) {
		await browser.storage.local.set(defaultOptions);
	}

	// We cleanup the tabs displayHints on start
	if (localStorage["displayHints"]) {
		const displayHints = localStorage["displayHints"] as DisplayHints;
		displayHints.tabs = {};
		await browser.storage.local.set({ displayHints });
	}
}
