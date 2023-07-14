import browser from "webextension-polyfill";
import { getCurrentTabId } from "./getCurrentTab";

/**
 * Check if the active element in the focused frame (if any) is editable
 *
 * @returns Resolves to true if the page has focus and the active element is
 * editable, otherwise resolves to false
 */
export async function checkActiveElementIsEditable() {
	const tabId = await getCurrentTabId();
	const frames = await browser.webNavigation.getAllFrames({ tabId });

	const sending = frames.map(async (frame) => {
		return browser.tabs.sendMessage(
			tabId,
			{
				type: "checkActiveElementIsEditable",
			},
			{ frameId: frame.frameId }
		);
	});

	const results = await Promise.all(sending);

	return results.includes(true);
}
