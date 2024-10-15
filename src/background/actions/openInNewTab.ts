import browser from "webextension-polyfill";
import { getCurrentTab } from "../utils/getCurrentTab";
import { retrieve } from "../../common/storage";

export async function openInNewTab(urls: string[], active: boolean) {
	if (active && urls.length > 1) {
		throw new Error("Can't make more than one tab active");
	}

	const currentTab = await getCurrentTab();
	let index: number | undefined;
	const newTabPosition = await retrieve("newTabPosition");

	if (newTabPosition === "relatedAfterCurrent") {
		const tabs = await browser.tabs.query({
			currentWindow: true,
		});
		const relatedTabs = tabs.filter((tab) => tab.openerTabId === currentTab.id);
		const lastRelatedTab = relatedTabs.pop();
		index = lastRelatedTab ? lastRelatedTab.index + 1 : currentTab.index + 1;
	}

	if (newTabPosition === "afterCurrent") {
		index = currentTab.index + 1;
	}

	if (newTabPosition === "atEnd") {
		index = 99_999;
	}

	await Promise.all(
		urls.map(async (url) =>
			browser.tabs.create({
				url,
				active,
				index: index ? index++ : undefined,
				openerTabId: currentTab.id,
			})
		)
	);
}
