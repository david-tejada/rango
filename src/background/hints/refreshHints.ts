import browser from "webextension-polyfill";
import { settings } from "../../common/settings/settings";
import { sendMessage } from "../messaging/sendMessage";

export async function refreshHints() {
	const activeTabs = await browser.tabs.query({ active: true });
	const inactiveTabs = await browser.tabs.query({ active: false });

	await Promise.allSettled(
		activeTabs
			.filter((tab) => isTabWithId(tab))
			.map(async ({ id }) => refreshHintsInTab(id))
	);

	await Promise.allSettled(
		inactiveTabs
			.filter((tab) => isTabWithId(tab))
			.map(async ({ id }) => refreshHintsInTab(id))
	);
}

async function refreshHintsInTab(tabId: number) {
	// First send the message to the main frame so it can initialize the stack
	await sendMessage("refreshHints", undefined, { tabId, frameId: 0 });

	// Then to the rest of the frames
	const allFrames = await browser.webNavigation.getAllFrames({ tabId });
	if (!allFrames) return;

	const childFrames = allFrames.filter(({ frameId }) => frameId !== 0);

	const sending = childFrames.map(async ({ frameId }) => {
		await sendMessage("refreshHints", undefined, { tabId, frameId });
	});

	await Promise.allSettled(sending);
}

settings.onChange(
	[
		"keyboardClicking",
		"includeSingleLetterHints",
		"useNumberHints",
		"hintsToExclude",
		"keysToExclude",
	],
	refreshHints
);

function isTabWithId(tab: { id?: number }): tab is { id: number } {
	return tab.id !== undefined;
}
