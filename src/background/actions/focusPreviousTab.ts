import browser from "webextension-polyfill";
import { assertDefined } from "../../typings/TypingUtils";

export async function focusPreviousTab() {
	const { tabsByRecency } = await browser.storage.local.get("tabsByRecency");
	const currentWindow = await browser.windows.getCurrent();
	assertDefined(currentWindow.id);
	const previousTabs = tabsByRecency[currentWindow.id] as number[];

	// The last tab id is the current tab so we need to get the one before that
	const previousTabId = previousTabs[previousTabs.length - 2];

	if (previousTabId) {
		await browser.tabs.update(previousTabId, { active: true });
	}
}
