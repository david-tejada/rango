import browser from "webextension-polyfill";
import { assertDefined } from "../../typings/TypingUtils";
import { getCurrentTabId } from "../tabs/getCurrentTab";

/**
 * Get all frames for the given tab id or the current tab if no tab id is
 * provided. Throw an error if there are no frames for the tab, which will only
 * happens for discarded tabs.
 */
export async function getAllFrames(tabId?: number) {
	const tabId_ = tabId ?? (await getCurrentTabId());
	const frames = await browser.webNavigation.getAllFrames({ tabId: tabId_ });
	// For most us frames should be always defined. `getAllFrames` only returns
	// null if the tab is discarded and we're usually sending messages to the
	// active tab.
	assertDefined(frames, `Error getting frames for tabId "${tabId_}".`);

	return frames;
}
