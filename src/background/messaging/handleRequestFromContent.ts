import { sendMessage } from "webext-bridge/background";
import browser from "webextension-polyfill";
import { openInNewTab } from "../actions/openInNewTab";
import {
	claimHints,
	initStack,
	reclaimHintsFromOtherFrames,
	releaseHints,
	storeHintsInFrame,
	withStack,
} from "../hints/hintsAllocator";
import { getTabMarker } from "../misc/tabMarkers";
import { getCurrentTabId } from "../utils/getCurrentTab";
import { removeReference } from "../utils/removeReference";
import {
	resetCustomSelectors,
	storeCustomSelectors,
} from "../utils/storeCustomSelectors";
import { onMessage, sendMessageToAllFrames } from "./webextBridgeWrapper";

export function setupContentScriptMessageHandlers() {
	onMessage("initStack", async ({ sender }) => {
		// Only the main frame (frameId 0) should be able to initialize the stack.
		// This is to be safe as we already make sure we are only sending this
		// request from the main frame of the content script.
		if (sender.frameId !== 0) return;

		return initStack(sender.tabId);
	});

	onMessage("claimHints", async ({ sender, data }) => {
		return claimHints(sender.tabId, sender.frameId, data.amount);
	});

	onMessage("reclaimHintsFromOtherFrames", async ({ sender, data }) => {
		return reclaimHintsFromOtherFrames(
			sender.tabId,
			sender.frameId,
			data.amount
		);
	});

	onMessage("releaseHints", async ({ sender, data }) => {
		return releaseHints(sender.tabId, data.hints);
	});

	onMessage("storeHintsInFrame", async ({ sender, data }) => {
		return storeHintsInFrame(sender.tabId, sender.frameId, data.hints);
	});

	onMessage("getHintsStackForTab", async ({ sender }) => {
		return withStack(sender.tabId, async (stack) => stack);
	});

	onMessage("openInNewTab", async ({ data }) => {
		await openInNewTab([data.url], true);
	});

	onMessage("openInBackgroundTab", async ({ data }) => {
		await openInNewTab(data.urls, false);
	});

	onMessage("getContentScriptContext", async ({ sender }) => {
		const currentTabId = await getCurrentTabId();
		return {
			tabId: sender.tabId,
			frameId: sender.frameId,
			currentTabId,
		};
	});

	onMessage("clickHintInFrame", async ({ data, sender }) => {
		const targetFrame = await withStack(sender.tabId, async (stack) => {
			return stack.assigned.get(data.hint);
		});

		if (targetFrame === undefined) return;

		await sendMessage(
			"clickElement",
			{ hint: data.hint },
			`content-script@${sender.tabId}.${targetFrame}`
		);
	});

	onMessage("markHintsAsKeyboardReachable", async ({ sender, data }) => {
		await sendMessageToAllFrames(
			"markHintsAsKeyboardReachable",
			{ letter: data.letter },
			sender.tabId
		);
	});

	onMessage("restoreKeyboardReachableHints", async ({ sender }) => {
		await sendMessageToAllFrames(
			"restoreKeyboardReachableHints",
			undefined,
			sender.tabId
		);
	});

	onMessage("isCurrentTab", async ({ sender }) => {
		const lastFocusedWindow = await browser.windows.getLastFocused();
		const tab = await browser.tabs.get(sender.tabId);
		return tab?.active && tab.windowId === lastFocusedWindow.id;
	});

	onMessage("getTabMarker", async ({ sender }) => {
		return getTabMarker(sender.tabId);
	});

	onMessage("storeCustomSelectors", async ({ data }) => {
		await storeCustomSelectors(data.url, data.selectors);
	});

	onMessage("resetCustomSelectors", async ({ data }) => {
		return resetCustomSelectors(data.url);
	});

	onMessage("removeReference", async ({ data }) => {
		return removeReference(data.hostPattern, data.name);
	});
}
