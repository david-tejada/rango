import browser, { Tabs } from "webextension-polyfill";
import { assertDefined } from "../typing/typing-utils";
import { getCurrentTab, getCurrentTabId } from "./current-tab";

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

	const currentTab = await getCurrentTab();
	const currentTabId = await getCurrentTabId();

	let filterFunction: (tab: Tabs.Tab) => boolean;

	switch (tabsToClose) {
		case "other":
			filterFunction = (tab) => tab.id !== currentTabId;
			break;

		case "left":
			filterFunction = (tab) => tab.index < currentTab.index;
			break;

		case "right":
			filterFunction = (tab) => tab.index > currentTab.index;
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
				tab.index >= currentTab.index - amount && tab.index < currentTab.index;
			break;

		case "next":
			assertDefined(amount);
			filterFunction = (tab) =>
				tab.index > currentTab.index && tab.index <= currentTab.index + amount;
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
