import browser from "webextension-polyfill";
import { getCurrentTabId } from "../utils/getCurrentTab";
import { getTabIdForMarker } from "../misc/tabMarkers";
import { getNextTabByIndex } from "../utils/tabUtils";
import { notify } from "../utils/notify";

export async function muteTab(tabMarkers?: string[], mute = true) {
	if (tabMarkers) {
		const tabsToMute = await Promise.all(tabMarkers.map(getTabIdForMarker));

		return Promise.all(
			tabsToMute.map(async (tabId) =>
				browser.tabs.update(tabId, { muted: mute })
			)
		);
	}

	const tabToMute = await getCurrentTabId();
	return browser.tabs.update(tabToMute, { muted: mute });
}

export async function muteNextTabWithSound() {
	const tabsWithSound = await browser.tabs.query({
		audible: true,
		muted: false,
	});

	const nextTabWithSound = await getNextTabByIndex(tabsWithSound);
	if (!nextTabWithSound)
		return notify("There are currently no tabs with sound", {
			type: "warning",
		});

	await browser.tabs.update(nextTabWithSound.id, { muted: true });
}

export async function unmuteNextMutedTab() {
	const mutedTabs = await browser.tabs.query({ muted: true });
	const nextMutedTab = await getNextTabByIndex(mutedTabs);
	if (!nextMutedTab)
		return notify("There are currently no muted tabs", {
			type: "warning",
		});

	await browser.tabs.update(nextMutedTab.id, { muted: false });
}

export async function muteAllTabsWithSound() {
	const tabsWithSound = await browser.tabs.query({
		audible: true,
		muted: false,
	});

	await Promise.all(
		tabsWithSound.map(async (tab) =>
			browser.tabs.update(tab.id, { muted: true })
		)
	);
}

export async function unmuteAllMutedTabs() {
	const mutedTabs = await browser.tabs.query({ muted: true });

	await Promise.all(
		mutedTabs.map(async (tab) => browser.tabs.update(tab.id, { muted: false }))
	);
}
