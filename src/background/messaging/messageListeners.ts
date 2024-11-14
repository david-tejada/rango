import browser from "webextension-polyfill";
import { getTargetFromHints } from "../../common/target/targetConversion";
import {
	claimHints,
	getStack,
	initStack,
	reclaimHintsFromOtherFrames,
	releaseHints,
	storeHintsInFrame,
	withStack,
} from "../hints/hintsAllocator";
import { getTabMarker } from "../misc/tabMarkers";
import { createRelatedTabs } from "../tabs/createRelatedTabs";
import { getCurrentTabId } from "../utils/getCurrentTab";
import {
	resetCustomSelectors,
	storeCustomSelectors,
} from "../utils/storeCustomSelectors";
import {
	onMessage,
	sendMessagesToTargetFrames,
	sendMessageToAllFrames,
} from "./backgroundMessageBroker";

export function addMessageListeners() {
	onMessage("initStack", async (_, { tabId, frameId }) => {
		// Only the main frame (frameId 0) should be able to initialize the stack.
		// This is to be safe as we already make sure we are only sending this
		// request from the main frame of the content script.
		if (frameId !== 0) return;

		return initStack(tabId);
	});

	onMessage("claimHints", async ({ amount }, { tabId, frameId }) => {
		return claimHints(tabId, frameId, amount);
	});

	onMessage(
		"reclaimHintsFromOtherFrames",
		async ({ amount }, { tabId, frameId }) => {
			return reclaimHintsFromOtherFrames(tabId, frameId, amount);
		}
	);

	onMessage("releaseHints", async ({ hints }, { tabId }) => {
		return releaseHints(tabId, hints);
	});

	onMessage("storeHintsInFrame", async ({ hints }, { tabId, frameId }) => {
		return storeHintsInFrame(tabId, frameId, hints);
	});

	onMessage("getHintStackForTab", async (_, { tabId }) => {
		return withStack(tabId, async (stack) => stack);
	});

	onMessage("getHintsInTab", async (_, { tabId }) => {
		const stack = await getStack(tabId);
		return [...stack.assigned.keys()];
	});

	onMessage("getContentScriptContext", async (_, { tabId, frameId }) => {
		const currentTabId = await getCurrentTabId();
		return {
			tabId,
			frameId,
			currentTabId,
		};
	});

	onMessage("clickHintInFrame", async ({ hint }, { tabId }) => {
		await sendMessagesToTargetFrames(
			"clickElement",
			{ target: getTargetFromHints([hint]) },
			tabId
		);
	});

	onMessage("markHintsAsKeyboardReachable", async ({ letter }, { tabId }) => {
		await sendMessageToAllFrames(
			"markHintsAsKeyboardReachable",
			{ letter },
			tabId
		);
	});

	onMessage("restoreKeyboardReachableHints", async (_, { tabId }) => {
		await sendMessageToAllFrames(
			"restoreKeyboardReachableHints",
			undefined,
			tabId
		);
	});

	onMessage("isCurrentTab", async (_, { tabId }) => {
		const lastFocusedWindow = await browser.windows.getLastFocused();
		const tab = await browser.tabs.get(tabId);
		return tab?.active && tab.windowId === lastFocusedWindow.id;
	});

	onMessage("createTabs", async ({ createPropertiesArray }) => {
		await createRelatedTabs(createPropertiesArray);
	});

	onMessage("getTabMarker", async (_, { tabId }) => {
		return getTabMarker(tabId);
	});

	onMessage("storeCustomSelectors", async ({ url, selectors }) => {
		await storeCustomSelectors(url, selectors);
	});

	onMessage("resetCustomSelectors", async ({ url }) => {
		return resetCustomSelectors(url);
	});
}
