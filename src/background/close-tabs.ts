import browser, { Tabs } from "webextension-polyfill";
import { assertDefined } from "../typing/typing-utils";

export async function closeTabsInWindow(
	tabsToClose:
		| "other"
		| "left"
		| "right"
		| "leftEnd"
		| "rightEnd"
		| "previous"
		| "next",
	amount?: number
) {
	const allTabsInWindow = await browser.tabs.query({
		currentWindow: true,
	});

	const activeTabs = await browser.tabs.query({
		currentWindow: true,
		active: true,
	});
	const activeTab = activeTabs[0];
	assertDefined(activeTab);
	const activeTabId = activeTab.id;
	assertDefined(activeTabId);

	let filterFunction: (tab: Tabs.Tab) => boolean;

	switch (tabsToClose) {
		case "other":
			filterFunction = (tab) => tab.id !== activeTabId;
			break;

		case "left":
			filterFunction = (tab) => tab.index < activeTab.index;
			break;

		case "right":
			filterFunction = (tab) => tab.index > activeTab.index;
			break;

		case "leftEnd":
			assertDefined(amount);
			filterFunction = (tab) => tab.index < amount;
			break;

		case "rightEnd":
			assertDefined(amount);
			filterFunction = (tab) => tab.index >= allTabsInWindow.length - amount;
			break;

		case "previous":
			assertDefined(amount);
			filterFunction = (tab) =>
				tab.index >= activeTab.index - amount && tab.index < activeTab.index;
			break;

		case "next":
			assertDefined(amount);
			filterFunction = (tab) =>
				tab.index > activeTab.index && tab.index <= activeTab.index + amount;
			break;

		default:
			break;
	}

	const tabsIdsToRemove = allTabsInWindow
		.filter((tab) => filterFunction(tab))
		.map((tab) => tab.id)
		.filter((tabId): tabId is number => typeof tabId === "number");
	await browser.tabs.remove(tabsIdsToRemove);
}
