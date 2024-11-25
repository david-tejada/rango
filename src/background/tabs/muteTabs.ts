import browser from "webextension-polyfill";
import { type TabMark, type Target } from "../../typings/Target/Target";
import { getTabIdsFromTarget } from "../target/tabMarkers";
import { getCurrentTabId } from "../utils/getCurrentTab";
import { notify } from "../utils/notify";
import { getNextTabByIndex } from "../utils/tabUtils";

export async function muteTab(target?: Target<TabMark>, mute = true) {
	const tabIds = target
		? await getTabIdsFromTarget(target)
		: [await getCurrentTabId()];

	return Promise.all(
		tabIds.map(async (tabId) => browser.tabs.update(tabId, { muted: mute }))
	);
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
