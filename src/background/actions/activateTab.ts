/* eslint-disable no-await-in-loop */
import browser from "webextension-polyfill";
import { type TabMark, type Target } from "../../typings/Target/Target";
import { getTabIdsFromTarget } from "../tabs/target";

async function getFirstTabByWindow(tabIds: number[]) {
	const result = new Map<number, browser.Tabs.Tab>();
	for (const tabId of tabIds) {
		const tab = await browser.tabs.get(tabId);

		if (tab.windowId && !result.has(tab.windowId)) {
			result.set(tab.windowId, tab);
		}
	}

	return Array.from(result.values());
}

/**
 * Activate the tab with the given marker. If more than one marker is provided
 * it will activate the given tabs as long as they belong to different windows.
 * It will focus the window of the first tab provided.
 */
export async function activateTab(target: Target<TabMark>) {
	const tabIds = await getTabIdsFromTarget(target);
	const splitTabs = await getFirstTabByWindow(tabIds);

	for (const [index, tab] of splitTabs.entries()) {
		await browser.tabs.update(tab.id, { active: true });
		if (index === 0) {
			await browser.windows.update(tab.windowId!, { focused: true });
		} else if (tab.discarded) {
			await browser.tabs.reload(tab.id);
		}
	}
}
