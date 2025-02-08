import browser from "webextension-polyfill";
import { store } from "../../common/storage/store";

/**
 * Focuses the tab in the current window that was most recently active.
 */
export async function focusPreviousTabInWindow() {
	const currentWindow = await browser.windows.getCurrent();
	if (!currentWindow.id) {
		throw new Error("Unable to find previously active tab.");
	}

	const previousTab = await findPreviouslyActiveTab(currentWindow.id);
	if (!previousTab) throw new Error("Unable to find previously active tab.");

	await browser.tabs.update(previousTab.id, { active: true });
}

async function findPreviouslyActiveTab(windowId: number) {
	const tabsInWindow = await browser.tabs.query({ windowId });

	// If `Tab.lastAccessed` is available, we can use it to find the previous tab.
	if (tabsInWindow.some((tab) => tab.lastAccessed)) {
		const previousTabsByLastAccessed = tabsInWindow
			.filter((tab) => !tab.active && tab.lastAccessed)
			.sort((a, b) => b.lastAccessed! - a.lastAccessed!);

		return previousTabsByLastAccessed[0];
	}

	// If `Tab.lastAccessed` is not available (Safari) we use `tabsByRecency` to
	// find the previous tab.
	const tabsByRecency = (await store.get("tabsByRecency")) ?? [];

	for (const tabId of tabsByRecency) {
		const tab = tabsInWindow.findLast((tab) => tab.id === tabId && !tab.active);
		if (tab) return tab;
	}

	return undefined;
}

/**
 * Start tracking tabs to be able to use the command `focusPreviousTab`.
 *
 * This is only necessary in Safari since `Tab.lastAccessed` is not available.
 * For simplicity we track tabs in all browsers. Once Safari support is good
 * enough we can remove this code and the relevant part in
 * `findPreviouslyActiveTab.
 */
export function trackRecentTabs() {
	browser.tabs.onActivated.addListener(async ({ tabId, previousTabId }) => {
		await store.withLock(
			"tabsByRecency",
			(tabsByRecency) => {
				// If the browser launches with tabs 1 (active) and 2, and we switch to
				// tab 2, then tab 1 won't be in `tabsByRecency` unless we add
				// `previousTabId` here too.
				if (previousTabId) {
					tabsByRecency = tabsByRecency.filter((id) => id !== previousTabId);
					tabsByRecency.push(previousTabId);
				}

				tabsByRecency = tabsByRecency.filter((id) => id !== tabId);
				tabsByRecency.push(tabId);

				return [tabsByRecency];
			},
			() => []
		);
	});

	browser.tabs.onRemoved.addListener(async (tabId) => {
		await store.withLock(
			"tabsByRecency",
			(tabsByRecency) => [tabsByRecency.filter((id) => id !== tabId)],
			() => []
		);
	});
}
