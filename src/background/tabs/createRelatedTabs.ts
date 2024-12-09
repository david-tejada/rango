import browser, { type Tabs } from "webextension-polyfill";
import { retrieve } from "../../common/storage/storage";
import { getCurrentTabId } from "./getCurrentTab";

/**
 * Create tabs related to the current tab. The index of the new tabs is
 * determined by the `newTabPosition` setting. The `openerTabId` of the new tabs
 * is set to the id of the current tab.
 */
export async function createRelatedTabs(
	createPropertiesArray: Tabs.CreateCreatePropertiesType[]
) {
	const tabId = await getCurrentTabId();
	let newIndex = await getNewTabIndex(tabId);

	await Promise.all(
		createPropertiesArray.map(async (createProperties) =>
			browser.tabs.create({
				...createProperties,
				index: newIndex++,
				openerTabId: tabId,
			})
		)
	);
}

async function getNewTabIndex(tabId: number) {
	const tab = await browser.tabs.get(tabId);
	const newTabPosition = await retrieve("newTabPosition");

	switch (newTabPosition) {
		case "relatedAfterCurrent": {
			const tabs = await browser.tabs.query({
				currentWindow: true,
			});
			const relatedTabs = tabs.filter((t) => t.openerTabId === tabId);
			const lastRelatedTab = relatedTabs.pop();
			return lastRelatedTab ? lastRelatedTab.index + 1 : tab.index + 1;
		}

		case "afterCurrent": {
			return tab.index + 1;
		}

		case "atEnd": {
			return 99_999;
		}
	}
}
