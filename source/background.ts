// eslint-disable-next-line import/no-unassigned-import
import "./options-storage";
import browser from "webextension-polyfill";
import { Message } from "./types";

browser.commands.onCommand.addListener(async (command: string) => {
	if (command === "get-talon-request") {
		try {
			const request = await getMessageFromClipboard();
			await sendMessageToActiveTab(request);
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
	const clipText = await navigator.clipboard.readText();
	const request = JSON.parse(clipText) as Message;
	if (request.type !== "request") {
		throw new Error("Error: No request message present in the clipboard");
	}

	// We send the response so that talon can make sure the request was received
	const response = JSON.stringify({ type: "response" } as Message);
	await navigator.clipboard.writeText(response);

	return request;
}

async function sendMessageToActiveTab(message: Message) {
	const activeTabs = await browser.tabs.query({
		currentWindow: true,
		active: true,
	});
	const activeTab = activeTabs[0];
	await browser.tabs.sendMessage(activeTab!.id!, message);
}
