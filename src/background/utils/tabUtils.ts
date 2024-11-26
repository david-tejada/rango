import type browser from "webextension-polyfill";
import { getCurrentTab } from "../tabs/getCurrentTab";

/**
 * Given an array of tabs as a parameter, return the first tab in the array that
 * has a greater index than the current tab. If no such tab exists in the
 * current window cycle through all existing windows returning to the start of
 * the current window if necessary.
 */
export async function getNextTabByIndex(tabs: browser.Tabs.Tab[]) {
	const currentTab = await getCurrentTab();

	return (
		tabs.find(
			(tab) =>
				(tab.windowId === currentTab.windowId &&
					tab.index > currentTab.index) ||
				tab.windowId !== currentTab.windowId
		) ?? tabs[0]
	);
}
