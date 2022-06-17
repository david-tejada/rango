import browser from "webextension-polyfill";

const defaultOptions: Record<string, unknown> = {
	hintFontSize: 10,
	showHints: true,
	hintWeight: "auto",
	hintStyle: "boxed",
	urlInTitle: true,
};

async function clearUnusedStacks() {
	const tabs = await browser.tabs.query({});
	const tabIds = new Set(tabs.map((tab) => tab.id));
	const storage = await browser.storage.local.get(null);
	const deletePromises = [];
	for (const key in storage) {
		if (key.startsWith("hints-stack-")) {
			const stackTabId = Number.parseInt(key.replace("hints-stack-", ""), 10);
			if (!tabIds.has(stackTabId)) {
				deletePromises.push(browser.storage.local.remove(key));
			}
		}
	}

	await Promise.all(deletePromises);
}

export async function initStorage() {
	await clearUnusedStacks();
	const optionNames = Object.keys(defaultOptions);
	const savedOptions = await browser.storage.local.get(optionNames);
	const optionsToStore: Record<string, unknown> = {};

	for (const key of optionNames) {
		if (savedOptions[key] === undefined) {
			optionsToStore[key] = defaultOptions[key];
		}
	}

	await browser.storage.local.set(optionsToStore);
}
