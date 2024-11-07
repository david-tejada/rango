import browser from "webextension-polyfill";
import { type TabMark, type Target } from "../../typings/Target/Target";
import { getTabIds } from "../tabs/tabs";

export async function closeTab(target: Target<TabMark>) {
	const tabsToClose = await getTabIds(target);

	await browser.tabs.remove(tabsToClose);
}
