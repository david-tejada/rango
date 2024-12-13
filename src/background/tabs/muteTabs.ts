import browser from "webextension-polyfill";
import { type TabMark, type Target } from "../../typings/Target/Target";
import { getTabIdsFromTarget } from "../target/tabMarkers";
import { notify } from "../utils/notify";
import { getCurrentTabId } from "./getCurrentTab";
import { getNextTabByIndex } from "./getNextTabByIndex";

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
		return notify.warning("There are currently no tabs with sound");

	await browser.tabs.update(nextTabWithSound.id, { muted: true });
}

export async function unmuteNextMutedTab() {
	const mutedTabs = await browser.tabs.query({ muted: true });
	const nextMutedTab = await getNextTabByIndex(mutedTabs);
	if (!nextMutedTab) return notify.warning("There are currently no muted tabs");

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
