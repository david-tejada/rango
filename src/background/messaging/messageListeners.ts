import browser from "webextension-polyfill";
import { getTargetFromLabels } from "../../common/target/targetConversion";
import {
	claimLabels,
	reclaimLabelsFromOtherFrames,
	releaseLabels,
	storeLabelsInFrame,
} from "../hints/labels/labelAllocator";
import { getRequiredStack, initStack } from "../hints/labels/labelStack";
import { createRelatedTabs } from "../tabs/createRelatedTabs";
import { getTabMarker } from "../tabs/tabMarkers";
import { onMessage } from "./backgroundMessageBroker";
import { sendMessageToAllFrames } from "./sendMessageToAllFrames";
import { sendMessageToTargetFrames } from "./sendMessageToTargetFrames";

export function addMessageListeners() {
	onMessage("initStack", async (_, { tabId, frameId }) => {
		// Only the main frame (frameId 0) should be able to initialize the stack.
		// This is to be safe as we already make sure we are only sending this
		// request from the main frame of the content script.
		if (frameId !== 0) return;

		return initStack(tabId);
	});

	onMessage("claimLabels", async ({ amount }, { tabId, frameId }) => {
		return claimLabels(tabId, frameId, amount);
	});

	onMessage(
		"reclaimLabelsFromOtherFrames",
		async ({ amount }, { tabId, frameId }) => {
			return reclaimLabelsFromOtherFrames(tabId, frameId, amount);
		}
	);

	onMessage("releaseLabels", async ({ labels }, { tabId }) => {
		return releaseLabels(tabId, labels);
	});

	onMessage("storeLabelsInFrame", async ({ labels }, { tabId, frameId }) => {
		return storeLabelsInFrame(tabId, frameId, labels);
	});

	onMessage("getLabelStackForTab", async (_, { tabId }) => {
		return getRequiredStack(tabId);
	});

	onMessage("getLabelsInViewport", async (_, { tabId }) => {
		const { results } = await sendMessageToAllFrames(
			"getLabelsInViewport",
			undefined,
			tabId
		);

		return results.flat();
	});

	onMessage("getContentScriptContext", async (_, { tabId, frameId }) => ({
		tabId,
		frameId,
	}));

	onMessage("clickHintInFrame", async ({ hint }, { tabId }) => {
		await sendMessageToTargetFrames(
			"clickElement",
			{ target: getTargetFromLabels([hint]) },
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
}
