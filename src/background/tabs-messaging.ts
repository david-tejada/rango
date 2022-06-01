import browser from "webextension-polyfill";
import { Mutex } from "async-mutex";
import {
	ContentRequest,
	ScriptResponse,
	StorableHintsStack,
} from "../typing/types";
import {
	initStack,
	claimHints,
	releaseHints,
	releaseOrphanHints,
} from "./hints-allocator";

async function getActiveTab(): Promise<browser.Tabs.Tab | undefined> {
	const activeTabs = await browser.tabs.query({
		currentWindow: true,
		active: true,
	});

	return activeTabs[0];
}

async function getHintFrameId(
	tabId: number,
	hintText?: string
): Promise<number> {
	const stackName = `hints-stack-${tabId}`;
	const storage = await browser.storage.local.get(stackName);
	const storableStack = storage[stackName] as StorableHintsStack;
	const stack = {
		free: storableStack.free,
		assigned: new Map(storableStack.assigned),
	};

	if (hintText) {
		const hintFrameId = stack.assigned.get(hintText);
		return hintFrameId ? hintFrameId : 0;
	}

	return 0;
}

export async function sendRequestToActiveTab(
	request: ContentRequest
): Promise<ScriptResponse | void> {
	const activeTab = await getActiveTab();
	const hintText = request.target;
	// We only want to send the request to the frame with the target hint or to the main
	// frame in case that the request doesn't have a hint
	if (activeTab?.id) {
		const frameId = await getHintFrameId(activeTab.id, hintText);
		return browser.tabs.sendMessage(activeTab.id, request, {
			frameId,
		}) as Promise<ScriptResponse | void>;
	}

	throw new Error("Failed sending request to active tab");
}

export async function sendRequestToAllTabs(request: ContentRequest) {
	const results = [];
	const allTabs = await browser.tabs.query({});
	for (const tab of allTabs) {
		results.push(browser.tabs.sendMessage(tab.id!, request));
	}

	// We use allSettled here because we know some promises will fail, as the extension
	// is not able to run on all tabs, for example, in pages like "about:debugging".
	// So we just care that the promise either resolves or rejects
	await Promise.allSettled(results);
}

const mutex = new Mutex();

browser.runtime.onMessage.addListener(async (message, sender) => {
	const tabId = sender.tab!.id!;
	const frameId = sender.frameId ?? 0;

	switch (message.action.type) {
		case "openInNewTab":
			await browser.tabs.create({
				url: message.action.target as string,
			});
			break;

		case "initStack":
			return mutex.runExclusive(async () => {
				return initStack(tabId, frameId);
			});

		case "claimHints":
			return mutex.runExclusive(async () => {
				return claimHints(message.action.amount, tabId, frameId);
			});

		case "releaseHints":
			return releaseHints(message.action.hints, tabId);

		case "releaseOrphanHints":
			return releaseOrphanHints(message.action.hints, tabId, frameId);

		default:
			break;
	}

	return undefined;
});
