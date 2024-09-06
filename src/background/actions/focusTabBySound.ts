import browser from "webextension-polyfill";
import { notify } from "../utils/notify";
import { getCurrentTab } from "../utils/getCurrentTab";

let tabLastSounded: number | undefined;

export function setTabLastSounded(tabId: number) {
	tabLastSounded = tabId;
}

export async function focusTabLastSounded() {
	if (!tabLastSounded)
		return notify("No tab has emitted sound since startup.", {
			type: "warning",
		});

	const tab = await browser.tabs.get(tabLastSounded);
	await browser.windows.update(tab.windowId!, { focused: true });
	await browser.tabs.update(tabLastSounded, { active: true });
}

export async function focusNextTabWithSound() {
	const currentTab = await getCurrentTab();
	const tabsWithSound = await browser.tabs.query({
		audible: true,
		muted: false,
	});

	const nextTabWithSound =
		tabsWithSound.find(
			(tab) =>
				(tab.windowId === currentTab.windowId &&
					tab.index > currentTab.index) ||
				tab.windowId !== currentTab.windowId
		) ?? tabsWithSound[0];

	if (!nextTabWithSound) return;

	await browser.windows.update(nextTabWithSound.windowId!, { focused: true });
	await browser.tabs.update(nextTabWithSound.id, { active: true });
}
