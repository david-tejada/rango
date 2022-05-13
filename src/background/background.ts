import browser from "webextension-polyfill";
import { Message, HintsStacks } from "../types/types";
import { hintStack } from "../lib/hint-stack";
import { getMessageFromClipboard, writeResponseToClipboard } from "./clipboard";

const hintsStacks: HintsStacks = {};

browser.browserAction.onClicked.addListener(toggleHintsInAllTabs);

browser.commands.onCommand.addListener(async (command: string) => {
	if (command === "get-talon-request") {
		let response: Message | undefined;
		try {
			const request = await getMessageFromClipboard();
			if (request.action?.type === "toggleHints") {
				await toggleHintsInAllTabs();
				response = { type: "response", action: { type: "ok" } };
			} else {
				response = await sendMessageToActiveTab(request);
			}

			if (response) {
				await writeResponseToClipboard(response);
			}
		} catch (error: unknown) {
			let errorMessage = "Error: There was an error";
			if (error instanceof Error) {
				errorMessage = error.message;
			}

			console.error(errorMessage);
		}
	}

	if (command === "toggle-hints") {
		await toggleHintsInAllTabs();
	}
});

async function getActiveTab(): Promise<browser.Tabs.Tab | undefined> {
	const activeTabs = await browser.tabs.query({
		currentWindow: true,
		active: true,
	});

	return activeTabs[0];
}

async function sendMessageToActiveTab(
	message: Message
): Promise<Message | undefined> {
	const activeTab = await getActiveTab();
	const hintText = message.action?.target;
	// We only want to send the message to the frame with the target hint
	const frameId = hintText
		? hintsStacks[activeTab!.id!]?.assigned.get(hintText)
		: 0;
	if (activeTab?.id) {
		return (await browser.tabs.sendMessage(activeTab.id, message, {
			frameId,
		})) as Message;
	}

	return undefined;
}

async function sendMessageToAllTabs(message: Message) {
	const results = [];
	const allTabs = await browser.tabs.query({});
	for (const tab of allTabs) {
		results.push(browser.tabs.sendMessage(tab.id!, message));
	}

	await Promise.all(results);
}

browser.runtime.onMessage.addListener(async (message, sender) => {
	const tabId = sender.tab?.id;
	const frameId = sender.frameId;
	if (message.action.type === "openInNewTab") {
		await browser.tabs.create({
			url: message.action.target as string,
		});
	}

	if (tabId && message.action.type === "initTabHintsStack") {
		hintsStacks[tabId] = {
			free: [...hintStack],
			assigned: new Map<string, number>(),
		};
	}

	if (tabId && hintsStacks[tabId] && message.action.type === "claimHintText") {
		const hintText = hintsStacks[tabId]!.free.pop()!;
		if (hintText) {
			hintsStacks[tabId]!.assigned.set(hintText, frameId!);
			return hintText as string;
		}
	}

	if (tabId && message.action.type === "releaseHintText") {
		const hintText = message.action.target as string;
		if (hintText) {
			hintsStacks[tabId]!.free.push(hintText)!;
			hintsStacks[tabId]!.assigned.delete(hintText);
		}
	}

	return undefined;
});

async function toggleHintsInAllTabs() {
	try {
		const request: Message = {
			type: "request",
			action: {
				type: "toggleHints",
			},
		};
		await sendMessageToAllTabs(request);
	} catch (error: unknown) {
		let errorMessage = "Error: There was an error";
		if (error instanceof Error) {
			errorMessage = error.message;
		}

		console.error(errorMessage);
	}
}
