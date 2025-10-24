import browser from "webextension-polyfill";
import { type TabMark, type Target } from "../../typings/Target/Target";
import { getTabIdsFromTarget } from "../target/tabMarkers";
import { getRequiredCurrentTabId } from "./getCurrentTab";

export async function pinTab(target?: Target<TabMark>, pinned = true) {
	const tabIds = target
		? await getTabIdsFromTarget(target)
		: [await getRequiredCurrentTabId()];

	return Promise.all(
		tabIds.map(async (tabId) => browser.tabs.update(tabId, { pinned }))
	);
}
