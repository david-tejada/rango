import browser from "webextension-polyfill";
import { type TabMark, type Target } from "../../typings/Target/Target";
import { getTabIdsFromTarget } from "../target/tabMarkers";

/**
 * Activate the tab with the given tab hint. If more than one tab hint is
 * provided it will activate the given tabs as long as they belong to different
 * windows. It will focus the window of the first tab provided.
 */
export async function activateTab(target: Target<TabMark>) {
	const tabIds = await getTabIdsFromTarget(target);
	const splitTabs = await getFirstTabByWindow(tabIds);

	if (splitTabs.length === 0) return;

	await Promise.all(
		splitTabs.map(async ({ id }) =>
			browser.tabs.update(id, { active: true }).then(async ({ discarded }) =>
				// In Chrome, discarded tabs of a non-focused window don't get reloaded
				// even if they become active.
				discarded ? browser.tabs.reload(id) : undefined
			)
		)
	);

	await browser.windows.update(splitTabs[0]!.windowId!, { focused: true });
}

/**
 * Get an array with the first tab of each window from the given tab IDs.
 */
async function getFirstTabByWindow(tabIds: number[]) {
	const result = new Map<number, browser.Tabs.Tab>();
	const tabs = await Promise.all(
		tabIds.map(async (tabId) => browser.tabs.get(tabId))
	);

	for (const tab of tabs) {
		if (tab.windowId && !result.has(tab.windowId)) {
			result.set(tab.windowId, tab);
		}
	}

	return Array.from(result.values());
}
