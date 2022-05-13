import browser from "webextension-polyfill";
import { Message } from "../types/types";
import {
	getHintFrameId,
	initTabHintsStack,
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
	const tabId = sender.tab!.id!;
	const frameId = sender.frameId ?? 0;
	const hintText = message.action.target as string;

	switch (message.action.type) {
		case "openInNewTab":
			await browser.tabs.create({
				url: message.action.target as string,
			});
			break;

		case "initTabHintsStack":
			initTabHintsStack(tabId);
			break;

		case "claimHintText":
			return claimHintText(tabId, frameId);

		case "releaseHintText":
			releaseHintText(tabId, hintText);
			break;

		default:
			break;
	}

	return undefined;
});
