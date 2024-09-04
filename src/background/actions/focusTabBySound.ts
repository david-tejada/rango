import browser from "webextension-polyfill";
import { notify } from "../utils/notify";

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
