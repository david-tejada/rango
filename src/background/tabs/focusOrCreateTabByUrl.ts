import browser from "webextension-polyfill";
import { getRequiredCurrentTab } from "./getCurrentTab";

/**
 * Focuses or creates a tab with the given URL.
 *
 * First attempts to find an existing tab in the current window that starts with the URL.
 * If found, focuses that tab. If not found in current window, looks in other windows.
 * If no matching tab exists in any window, creates a new tab with the URL.
 *
 * @param url - The URL to match against or create a tab with
 */
export async function focusOrCreateTabByUrl(url: string) {
	const tabs = await tabsQueryWithFallback(url);
	const tabToFocus = await getTabPrioritizeCurrentWindow(tabs);

	if (tabToFocus?.id) {
		await browser.windows.update(tabToFocus.windowId!, { focused: true });
		await browser.tabs.update(tabToFocus.id, { active: true });
	} else {
		return browser.tabs.create({ url, active: true });
	}

	return undefined;
}

/**
 * Query tabs with fallback for when the protocol is not http or https, for
 * example "about:" or "chrome:" pages
 */
async function tabsQueryWithFallback(url: string) {
	const { protocol, host, pathname } = new URL(url);

	if (protocol.startsWith("http")) {
		return browser.tabs.query({ url: `*://${host}${pathname}*` });
	}

	const allTabs = await browser.tabs.query({});
	return allTabs.filter((tab) => tab.url?.startsWith(url));
}

/**
 * Given an array of Tabs it returns the first one in the current window.
 * If none belongs to the current window, it returns the first one.
 */
async function getTabPrioritizeCurrentWindow(tabs: browser.Tabs.Tab[]) {
	const currentTab = await getRequiredCurrentTab();
	return tabs.find((tab) => tab.windowId === currentTab.windowId) ?? tabs[0];
}
