import browser from "webextension-polyfill";
import {
	Message,
	Command,
	ScriptContext,
	StorableHintsStack,
} from "../types/types";

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
	return hintText ? stack.assigned.get(hintText)! : 0;
}

export async function sendCommandToActiveTab(
	command: Command
): Promise<Message> {
	const activeTab = await getActiveTab();
	const hintText = command.target;
	// We only want to send the command to the frame with the target hint or to the main
	// frame in case that the command doesn't have a hint
	if (activeTab?.id) {
		const frameId = await getHintFrameId(activeTab.id, hintText);
		return (await browser.tabs.sendMessage(activeTab.id, command, {
			frameId,
		})) as Message;
	}

	return {
		type: "response",
		action: { type: "commandFailed" },
	};
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
	const scriptContext: ScriptContext = {
		tabId,
		frameId,
	};

	switch (message.action.type) {
		case "openInNewTab":
			await browser.tabs.create({
				url: message.action.target as string,
			});
			break;

		case "getScriptContext":
			return scriptContext;

		default:
			break;
	}

	return undefined;
});
