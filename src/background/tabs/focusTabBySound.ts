import browser from "webextension-polyfill";
import { notify } from "../utils/notify";
import { getNextTabByIndex } from "./getNextTabByIndex";

let tabLastSounded: number | undefined;

/**
 * Sets the tab that last started to play sound.
 */
export function setTabLastSounded(tabId: number) {
	tabLastSounded = tabId;
}

/**
 * Focuses the tab that last started to play sound.
 */
export async function focusTabLastSounded() {
	if (!tabLastSounded)
		return notify.warning("No tab has emitted sound since startup.");

	const tab = await browser.tabs.get(tabLastSounded);
	await browser.windows.update(tab.windowId!, { focused: true });
	await browser.tabs.update(tabLastSounded, { active: true });
}

/**
 * Focuses the next tab that is audible and not muted.
 */
export async function focusNextTabWithSound() {
	const tabsWithSound = await browser.tabs.query({
		audible: true,
		muted: false,
	});

	const nextTabWithSound = await getNextTabByIndex(tabsWithSound);
	if (!nextTabWithSound) return;

	await browser.windows.update(nextTabWithSound.windowId!, { focused: true });
	await browser.tabs.update(nextTabWithSound.id, { active: true });
}

/**
 * Focuses the next tab that is muted.
 */
export async function focusNextMutedTab() {
	const mutedTabs = await browser.tabs.query({ muted: true });
	const nextMutedTab = await getNextTabByIndex(mutedTabs);
	if (!nextMutedTab) return;

	await browser.windows.update(nextMutedTab.windowId!, { focused: true });
	await browser.tabs.update(nextMutedTab.id, { active: true });
}

/**
 * Focuses the next tab that is audible. This tab might be muted.
 */
export async function focusNextAudibleTab() {
	const audibleTabs = await browser.tabs.query({ audible: true });
	const nextAudibleTab = await getNextTabByIndex(audibleTabs);
	if (!nextAudibleTab) return;

	await browser.windows.update(nextAudibleTab.windowId!, { focused: true });
	await browser.tabs.update(nextAudibleTab.id, { active: true });
}
