import browser, { type Tabs } from "webextension-polyfill";

/**
 * Returns the current tab.
 *
 * @throws {Error} If the current tab cannot be retrieved.
 */
export async function getRequiredCurrentTab(): Promise<Tabs.Tab> {
	const currentTab = await getCurrentTab();

	if (!currentTab) {
		throw new Error("Unable to retrieve the current tab");
	}

	return currentTab;
}

/**
 * Returns the current tab id.
 *
 * @throws {Error} If the current tab id cannot be retrieved.
 */
export async function getRequiredCurrentTabId(): Promise<number> {
	const currentTab = await getCurrentTab();

	if (!currentTab?.id) {
		throw new Error("Unable to retrieve the current tab id");
	}

	return currentTab.id;
}

/**
 * Returns the current tab.
 */
export async function getCurrentTab() {
	const currentTabArray = await browser.tabs.query({
		currentWindow: true,
		active: true,
	});

	return currentTabArray[0];
}
