import browser from "webextension-polyfill";
import Fuse from "fuse.js";
import { notify } from "../utils/notify";
import { getCurrentTab } from "../utils/getCurrentTab";

let matches: browser.Tabs.Tab[] = [];
let selectedIndex = -1;

export async function focusTabByText(text: string) {
	const currentTab = await getCurrentTab();
	const allTabs = await browser.tabs.query({});

	const fuse = new Fuse(allTabs, {
		keys: ["url", "title"],
		ignoreLocation: true,
		includeScore: true,
		threshold: 0.4,
	});

	const results = fuse.search(text).sort((a, b) => {
		if (
			a.item.windowId === currentTab.windowId &&
			b.item.windowId !== currentTab.windowId
		) {
			return -1;
		}

		if (
			a.item.windowId !== currentTab.windowId &&
			b.item.windowId === currentTab.windowId
		) {
			return 1;
		}

		return a.score! - b.score!;
	});

	matches = results.map((result) => result.item);
	const targetTab = matches[0];
	selectedIndex = targetTab ? 0 : -1;

	if (targetTab?.id) {
		await browser.windows.update(targetTab.windowId!, { focused: true });
		await browser.tabs.update(targetTab.id, { active: true });
	} else {
		await notify(`No tab found with the text "${text}"`, { type: "warning" });
	}
}

export async function cycleTabsByText(step: number) {
	const length = matches.length;

	const currentTab = await getCurrentTab();
	if (length === 0 || (length === 1 && matches[0]!.id === currentTab.id)) {
		await notify("No more tabs matching the selected text.", {
			type: "warning",
		});
	}

	selectedIndex += step;
	// We adjust the index in case adding the step made it out of bounds
	selectedIndex =
		step > 0
			? selectedIndex % length
			: selectedIndex < 0
				? length - 1
				: selectedIndex;

	const targetTab = matches[selectedIndex];

	if (targetTab?.id) {
		await browser.windows.update(targetTab.windowId!, { focused: true });
		await browser.tabs.update(targetTab.id, { active: true });
	}
}

browser.tabs.onRemoved.addListener((tabId) => {
	const indexInMatches = matches.findIndex((tab) => tab.id === tabId);

	if (indexInMatches) {
		matches.splice(indexInMatches, 1);
	}
});
