import browser from "webextension-polyfill";
import {
	RangoOptions,
	StorableRangoOptions,
	StorableDisplayHints,
} from "../typing/types";

const defaultOptions: StorableRangoOptions = {
	hintFontSize: 10,
	displayHints: {
		global: true,
		tabs: [],
		hosts: [],
		paths: [],
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
	const localStorage = await browser.storage.local.get(
		Object.keys(defaultOptions)
	);

	let key: keyof RangoOptions;
	const storing = [];

	for (key in defaultOptions) {
		if (localStorage[key] === undefined) {
			storing.push(browser.storage.local.set({ [key]: defaultOptions[key] }));
		}
	}

	// We clean up the tabs in displayHints on start
	if (localStorage["displayHints"]) {
		const displayHints = localStorage["displayHints"] as StorableDisplayHints;
		displayHints.tabs = [];
		storing.push(browser.storage.local.set({ displayHints }));
	}

	await Promise.all(storing);
}
