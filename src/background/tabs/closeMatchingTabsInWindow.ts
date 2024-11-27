import browser, { type Tabs } from "webextension-polyfill";
import { getCurrentTab } from "./getCurrentTab";

/**
 * Closes all tabs in the current window that match the filter function.
 *
 * @param filterFunction - A function that takes a tab, the current tab, and the
 * total number of tabs in the window, and returns a boolean indicating whether
 * the tab should be closed.
 */
export async function closeFilteredTabsInWindow(
	filterFunction: (
		tab: Tabs.Tab,
		currentTab: Tabs.Tab,
		totalTabs: number
	) => boolean
) {
	const currentTab = await getCurrentTab();
	const allTabsInWindow = await browser.tabs.query({ currentWindow: true });
	const totalTabs = allTabsInWindow.length;

	const tabsIdsToRemove = allTabsInWindow
		.filter((tab) => filterFunction(tab, currentTab, totalTabs))
		.map((tab) => tab.id)
		.filter((tabId): tabId is number => typeof tabId === "number");

	await browser.tabs.remove(tabsIdsToRemove);
}
