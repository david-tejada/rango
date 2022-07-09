import browser from "webextension-polyfill";
import { getCurrentTabId } from "./current-tab";

// This function checks if any of the frames in the current tab has focus.
// We use this to avoid clicking when the user is in the devtools or in the adress bar
export async function assertDocumentFocused() {
	const tabId = await getCurrentTabId();
	const allFrames = await browser.webNavigation.getAllFrames({
		tabId,
	});

	const requesting = allFrames.map(async (frame) =>
		browser.tabs.sendMessage(
			tabId,
			{
				type: "checkIfDocumentHasFocus",
			},
			{ frameId: frame.frameId }
		)
	) as Array<Promise<boolean>>;

	await Promise.any(requesting);
}
