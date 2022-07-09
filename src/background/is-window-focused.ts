import browser from "webextension-polyfill";
import { getActiveTab } from "./tabs-messaging";

// This function checks if any of the frames in the current tab has focus.
// We use this to avoid clicking when the user is in the devtools or in the adress bar
export async function isWindowFocused(): Promise<boolean> {
	const activeTab = await getActiveTab();
	if (activeTab?.id) {
		const tabId = activeTab.id;
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

		return Promise.any(requesting);
	}

	return false;
}
