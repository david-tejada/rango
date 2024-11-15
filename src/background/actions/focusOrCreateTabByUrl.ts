import browser from "webextension-polyfill";
import { getCurrentTab } from "../utils/getCurrentTab";

/**
 * Given an array of Tabs it returns the first one in the current window or
 * just the first one if none belongs to the current window.
 */
async function getTabPrioritizeCurrentWindow(tabs: browser.Tabs.Tab[]) {
	const currentTab = await getCurrentTab();
	return tabs.find((tab) => tab.windowId === currentTab.windowId) ?? tabs[0];
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

export async function focusOrCreateTabByUrl(url: string) {
	const tabs = await tabsQueryWithFallback(url);
	const target = await getTabPrioritizeCurrentWindow(tabs);

	if (target?.id) {
		await browser.windows.update(target.windowId!, { focused: true });
		await browser.tabs.update(target.id, { active: true });
	} else {
		return browser.tabs.create({ url, active: true });
	}

	return undefined;
}
