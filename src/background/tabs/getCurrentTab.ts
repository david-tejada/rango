import browser, { type Tabs } from "webextension-polyfill";

export async function getCurrentTab(): Promise<Tabs.Tab> {
	const currentTabArray = await browser.tabs.query({
		currentWindow: true,
		active: true,
	});

	const currentTab = currentTabArray[0];

	if (!currentTab) {
		throw new Error("Unable to retrieve the current tab");
	}

	return currentTab;
}

export async function getCurrentTabId(): Promise<number> {
	const currentTab = await getCurrentTab();

	if (!currentTab.id) {
		throw new Error("Unable to retrieve the current tab id");
	}

	return currentTab.id;
}
