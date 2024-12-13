import browser from "webextension-polyfill";
import { arrayToTarget } from "../../common/target/targetConversion";
import {
	type TabMark,
	type TabMarkerMark,
	type Target,
} from "../../typings/Target/Target";
import { getTabIdForMarker } from "../tabs/tabMarkers";

export async function getTabIdsFromTarget(
	target: Target<TabMark>
): Promise<number[]> {
	if (target.type === "list") {
		return Promise.all(
			target.items.map(async (item) => getTabIdForMarker(item.mark.value))
		);
	}

	if (target.type === "range") {
		const anchorTabId = await getTabIdForMarker(target.anchor.mark.value);
		const activeTabId = await getTabIdForMarker(target.active.mark.value);

		const anchorTab = await browser.tabs.get(anchorTabId);
		const activeTab = await browser.tabs.get(activeTabId);

		if (anchorTab.windowId !== activeTab.windowId) {
			throw new Error("Anchor and active tabs are in different windows.");
		}

		const startTab = anchorTab.index < activeTab.index ? anchorTab : activeTab;
		const endTab = anchorTab.index < activeTab.index ? activeTab : anchorTab;

		const tabsInWindow = await browser.tabs.query({
			windowId: startTab.windowId,
		});

		return tabsInWindow
			.filter((tab) => tab.index >= startTab.index && tab.index <= endTab.index)
			.map((tab) => tab.id!);
	}

	return [await getTabIdForMarker(target.mark.value)];
}

export function getTargetFromTabMarkers(target: string[]) {
	return arrayToTarget<TabMarkerMark>(target, "tabMarker");
}
