import browser from "webextension-polyfill";
import { Message } from "../types/types";
import {
	getHintFrameId,
	addNewHintsStack,
	claimHintText,
	releaseHintText,
} from "./hints-dispatcher";

async function getActiveTab(): Promise<browser.Tabs.Tab | undefined> {
	const activeTabs = await browser.tabs.query({
		currentWindow: true,
		active: true,
	});

	return activeTabs[0];
}

export async function sendMessageToActiveTab(
	message: Message
): Promise<Message | undefined> {
	const activeTab = await getActiveTab();
	const hintText = message.action?.target;
	// We only want to send the message to the frame with the target hint or to the main
	// frame in case that the command doesn't have a hint
	if (activeTab?.id) {
		const frameId = hintText ? getHintFrameId(activeTab.id, hintText) : 0;
		return (await browser.tabs.sendMessage(activeTab.id, message, {
			frameId,
		})) as Message;
	}

	return undefined;
}

export async function sendMessageToAllTabs(message: Message) {
	const results = [];
	const allTabs = await browser.tabs.query({});
	for (const tab of allTabs) {
		results.push(browser.tabs.sendMessage(tab.id!, message));
	}

	await Promise.all(results);
}

browser.runtime.onMessage.addListener(async (message, sender) => {
	const tabId = sender.tab?.id;
	const frameId = sender.frameId ?? 0;
	if (message.action.type === "openInNewTab") {
		await browser.tabs.create({
			url: message.action.target as string,
		});
	}

	if (tabId && message.action.type === "initTabHintsStack") {
		addNewHintsStack(tabId);
	}

	if (tabId && message.action.type === "claimHintText") {
		return claimHintText(tabId, frameId);
	}

	if (tabId && message.action.type === "releaseHintText") {
		const hintText = message.action.target as string;
		releaseHintText(tabId, hintText);
	}

	return undefined;
});
