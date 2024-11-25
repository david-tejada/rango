import Fuse from "fuse.js";
import browser from "webextension-polyfill";
import { getCurrentTab } from "../utils/getCurrentTab";

/**
 * All tabs matching the previous search.
 */
let matches: browser.Tabs.Tab[] = [];

/**
 * The last match that was selected.
 */
let selectedMatch: { text: string; index: number } | undefined;

/**
 * Focuses the tab with the given text using fuzzy search with the title and
 * url.
 */
export async function focusTabByText(text: string) {
	selectedMatch = undefined;

	const currentWindow = await browser.windows.getCurrent();
	const allTabs = await browser.tabs.query({});

	const fuse = new Fuse(allTabs, {
		keys: ["url", "title"],
		ignoreLocation: true,
		includeScore: true,
		threshold: 0.4,
	});

	matches = fuse
		.search(text)
		// Sort the tabs by their score, preferring tabs in the current window.
		.sort((a, b) => {
			const aInCurrentWindow = a.item.windowId === currentWindow.id;
			const bInCurrentWindow = b.item.windowId === currentWindow.id;

			if (aInCurrentWindow && !bInCurrentWindow) return -1;
			if (!aInCurrentWindow && bInCurrentWindow) return 1;
			return a.score! - b.score!;
		})
		.map((result) => result.item);

	const targetTab = matches[0];
	if (!targetTab?.id) throw new Error(`No tab found with the text "${text}"`);

	selectedMatch = { text, index: 0 };
	await browser.windows.update(targetTab.windowId!, { focused: true });
	await browser.tabs.update(targetTab.id, { active: true });
}

/**
 * Cycles through the tabs matching the previous tab search.
 */
export async function cycleTabsByText(step: number) {
	const currentTab = await getCurrentTab();

	if (selectedMatch === undefined) {
		throw new Error(`No previous tab search to cycle through.`);
	}

	if (matches.length === 1 && matches[0]!.id === currentTab.id) {
		throw new Error(`No more tabs matching the text "${selectedMatch.text}".`);
	}

	// Update the selected match index. Wrap around the matches array when cycling
	selectedMatch.index =
		(selectedMatch.index + step + matches.length) % matches.length;

	const targetTab = matches[selectedMatch.index];

	// At this point the target tab must be defined. We are just being extra safe.
	if (!targetTab?.id) {
		throw new Error(`No tab found with the text "${selectedMatch.text}".`);
	}

	await browser.windows.update(targetTab.windowId!, { focused: true });
	await browser.tabs.update(targetTab.id, { active: true });
}

browser.tabs.onRemoved.addListener((tabId) => {
	const indexInMatches = matches.findIndex((tab) => tab.id === tabId);

	if (indexInMatches) {
		matches.splice(indexInMatches, 1);
	}
});
