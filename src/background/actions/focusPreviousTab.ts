import browser from "webextension-polyfill";
import { assertDefined } from "../../typings/TypingUtils";
import { retrieve } from "../../common/storage";

export async function focusPreviousTab() {
	const tabsByRecency = await retrieve("tabsByRecency");
	const currentWindow = await browser.windows.getCurrent();
	assertDefined(currentWindow.id);
	const previousTabs = tabsByRecency[currentWindow.id];
	assertDefined(previousTabs);

	// The last tab id is the current tab so we need to get the one before that
	const previousTabId = previousTabs[previousTabs.length - 2];

	if (previousTabId) {
		await browser.tabs.update(previousTabId, { active: true });
	}
}
