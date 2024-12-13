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
		const startTabId = await getTabIdForMarker(target.start.mark.value);
		const endTabId = await getTabIdForMarker(target.end.mark.value);

		const startTab = await browser.tabs.get(startTabId);
		const endTab = await browser.tabs.get(endTabId);

		if (startTab.windowId !== endTab.windowId) {
			throw new Error("Start and end tabs are in different windows.");
		}

		const firstTab = startTab.index < endTab.index ? startTab : endTab;
		const lastTab = startTab.index < endTab.index ? endTab : startTab;

		const tabsInWindow = await browser.tabs.query({
			windowId: startTab.windowId,
		});

		return tabsInWindow
			.filter(
				(tab) => tab.index >= firstTab.index && tab.index <= lastTab.index
			)
			.map((tab) => tab.id!);
	}

	return [await getTabIdForMarker(target.mark.value)];
}

export function getTargetFromTabMarkers(target: string[]) {
	return arrayToTarget<TabMarkerMark>(target, "tabMarker");
}
