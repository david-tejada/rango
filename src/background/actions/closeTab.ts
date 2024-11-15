import browser from "webextension-polyfill";
import { type TabMark, type Target } from "../../typings/Target/Target";
import { getTabIdsFromTarget } from "../tabs/target";

export async function closeTab(target: Target<TabMark>) {
	const tabsToClose = await getTabIdsFromTarget(target);

	await browser.tabs.remove(tabsToClose);
}
