import browser from "webextension-polyfill";
import { getTabIdForMarker } from "../misc/tabMarkers";

export async function closeTab(markers: string[]) {
	const tabsToClose = await Promise.all(
		markers.map(async (marker) => getTabIdForMarker(marker))
	);

	await browser.tabs.remove(tabsToClose);
}
