import browser from "webextension-polyfill";
import { Message, HintsStacks } from "../types/types";
import { hintStack } from "../lib/hint-stack";

const sandbox = document.createElement("textarea");
document.body.append(sandbox);

const hintsStacks: HintsStacks = {};

browser.browserAction.onClicked.addListener(async () => {
	try {
		const request: Message = {
			type: "request",
			action: {
				type: "toggleHints",
			},
		};
		await sendMessageToActiveTab(request);
	} catch (error: unknown) {
		let errorMessage = "Error: There was an error";
		if (error instanceof Error) {
			errorMessage = error.message;
		}

		console.error(errorMessage);
	}
});

browser.commands.onCommand.addListener(async (command: string) => {
	if (command === "get-talon-request") {
		try {
			const request = await getMessageFromClipboard();
			const response = await sendMessageToActiveTab(request);
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
		try {
			const request: Message = {
				type: "request",
				action: {
					type: "toggleHints",
				},
			};
			await sendMessageToActiveTab(request);
		} catch (error: unknown) {
			let errorMessage = "Error: There was an error";
			if (error instanceof Error) {
				errorMessage = error.message;
			}

			console.error(errorMessage);
		}
	}
});

async function getMessageFromClipboard(): Promise<Message> {
	let clipText: string;
	try {
		clipText = await navigator.clipboard.readText();
	} catch (error: unknown) {
		if (error instanceof DOMException) {
			clipText = getClipboard();
		}
	}

	const request = JSON.parse(clipText!) as Message;
	if (request.type !== "request") {
		throw new Error("Error: No request message present in the clipboard");
	}

	return request;
}

async function writeResponseToClipboard(responseObject: Message) {
	// We send the response so that talon can make sure the request was received
	// and to tell talon to execute any actions
	const response = JSON.stringify(responseObject);
	try {
		await navigator.clipboard.writeText(response);
	} catch (error: unknown) {
		if (error instanceof DOMException) {
			copyTextToClipboard(response);
		}
	}
}

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

function getClipboard() {
	let result = "";
	sandbox.focus();
	if (document.execCommand("paste")) {
		result = sandbox.value;
	}

	sandbox.value = "";
	return result;
}

function copyTextToClipboard(text: string) {
	sandbox.value = text;
	sandbox.select();
	document.execCommand("copy");
	sandbox.value = "";
}
