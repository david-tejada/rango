import browser from "webextension-polyfill";
import { retrieve } from "../../common/storage";

/**
 * Focuses the tab in the current window that was most recently active.
 */
export async function focusPreviousTab() {
	const tabsByRecency = await retrieve("tabsByRecency");
	const currentWindow = await browser.windows.getCurrent();

	const previousTabs = tabsByRecency.get(currentWindow.id!);
	if (!previousTabs) throw new Error("Unable to find previously focused tabs.");

	// The last tab id is the current tab so we need to get the one before that
	const previousTabId = previousTabs.at(-2);
	if (!previousTabId) throw new Error("Unable to find previously focused tab.");

	await browser.tabs.update(previousTabId, { active: true });
}
