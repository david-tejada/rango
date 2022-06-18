import browser from "webextension-polyfill";
import {
	RangoOptions,
	StorableRangoOptions,
	StorableHintsToggle,
} from "../typing/types";

const defaultOptions: StorableRangoOptions = {
	hintFontSize: 10,
	hintsToggle: {
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

	// We clean up the tabs in hintsToggle on start
	if (localStorage["hintsToggle"]) {
		const hintsToggle = localStorage["hintsToggle"] as StorableHintsToggle;
		hintsToggle.tabs = [];
		storing.push(browser.storage.local.set({ hintsToggle }));
	}

	await Promise.all(storing);
}
