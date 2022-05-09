import browser, { Tabs } from "webextension-polyfill";
import { Message } from "../types/types";

const sandbox = document.createElement("textarea");
document.body.append(sandbox);

browser.commands.onCommand.addListener(async (command: string) => {
	if (command === "get-talon-request") {
		try {
			const request = await getMessageFromClipboard();
			const response = await sendMessageToActiveTab(request);
			await writeResponseToClipboard(response);
		} catch (error: unknown) {
			let errorMessage = "Error: There was an error";
			if (error instanceof Error) {
				errorMessage = error.message;
			}

			console.log(errorMessage);
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
	if (activeTab?.id) {
		return (await browser.tabs.sendMessage(activeTab.id, message)) as Message;
	}

	return undefined;
}

browser.runtime.onMessage.addListener(async (message) => {
	if (message.action.type === "openInNewTab") {
		await browser.tabs.create({
			url: message.action.target as string,
		});
	}
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
