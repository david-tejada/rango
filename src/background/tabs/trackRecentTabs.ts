import { Mutex } from "async-mutex";
import browser from "webextension-polyfill";
import { retrieve, store } from "../../common/storage/storage";
import { getRequiredCurrentTab } from "./getCurrentTab";

/**
 * Start tracking tabs to be able to use the command `focusPreviousTab`.
 *
 * Keeps a register of the tabs for each window in order of recency. We keep a
 * register of all the tab ids for each window in order of recency. This is
 * useful in case one or multiple tabs are removed.
 */
export async function trackRecentTabs() {
	// We need to track the initial tab when the browser first opens
	const currentTab = await getRequiredCurrentTab();
	if (currentTab.windowId && currentTab.id) {
		await updateRecentTab(currentTab.windowId, currentTab.id, false);
	}

	browser.tabs.onActivated.addListener(async (activeInfo) => {
		await updateRecentTab(activeInfo.windowId, activeInfo.tabId, false);
	});

	browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
		await updateRecentTab(removeInfo.windowId, tabId, true);
	});
}

const mutex = new Mutex();

async function updateRecentTab(
	windowId: number,
	tabId: number,
	remove: boolean
) {
	// It is possible that onActivated and onRemoved execute at the same time when
	// a tab is removed so we need to run a mutex to avoid both modifying
	// tabsByRecency at the same time
	await mutex.runExclusive(async () => {
		const tabsByRecency = await retrieve("tabsByRecency");

		const tabsIds = tabsByRecency.get(windowId) ?? [];
		const index = tabsIds.indexOf(tabId);

		if (index !== -1) {
			tabsIds.splice(index, 1);
		}

		if (!remove && tabsIds.at(-1) !== tabId) {
			tabsIds.push(tabId);
		}

		tabsByRecency.set(windowId, tabsIds);

		await store("tabsByRecency", tabsByRecency);
	});
}
