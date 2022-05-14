import browser from "webextension-polyfill";
import { Message, Command } from "../types/types";
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

export async function sendCommandToActiveTab(
	command: Command
): Promise<Message | undefined> {
	const activeTab = await getActiveTab();
	const hintText = command.target;
	// We only want to send the command to the frame with the target hint or to the main
	// frame in case that the command doesn't have a hint
	if (activeTab?.id) {
		const frameId = hintText ? getHintFrameId(activeTab.id, hintText) : 0;
		return (await browser.tabs.sendMessage(activeTab.id, command, {
			frameId,
		})) as Message;
	}

	return undefined;
}

export async function sendCommandToAllTabs(command: Command): Promise<any> {
	const results = [];
	const allTabs = await browser.tabs.query({});
	for (const tab of allTabs) {
		results.push(browser.tabs.sendMessage(tab.id!, command));
	}

	// We use allSettled here because we know some promises will fail, as the extension
	// is not able to run on all tabs, for example, in pages like "about:debugging".
	// So we just care that the promise either resolves or rejects
	return Promise.allSettled(results);
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
