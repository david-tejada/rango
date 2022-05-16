import { Message } from "../types/types";
import { sendCommandToActiveTab } from "./tabs-messaging";

let lastRequestText: string | undefined;

async function getTextFromClipboard(): Promise<string | undefined> {
	try {
		return await navigator.clipboard.readText();
	} catch (error: unknown) {
		if (error instanceof TypeError) {
			return getChromiumClipboard();
		}

		return undefined;
	}
}

export async function getMessageFromClipboard(): Promise<Message> {
	const clipText = await getTextFromClipboard();
	lastRequestText = clipText;
	const request = JSON.parse(clipText!) as Message;
	if (request.type !== "request") {
		throw new Error("Error: No request message present in the clipboard");
	}

	return request;
}

export async function writeResponseToClipboard(responseObject: Message) {
	// We send the response so that talon can make sure the request was received
	// and to tell talon to execute any actions
	const response = JSON.stringify(responseObject);
	try {
		await navigator.clipboard.writeText(response);
	} catch (error: unknown) {
		if (error instanceof TypeError) {
			await copyToChromiumClipboard(response);
		}
	}
}

async function getChromiumClipboard(): Promise<string> {
	const response = await sendCommandToActiveTab({
		type: "getChromiumClipboard",
	});
	return response.action.textCopied!;
}

async function copyToChromiumClipboard(text: string): Promise<Message> {
	return sendCommandToActiveTab({
		type: "copyToChromiumClipboard",
		textToCopy: text,
	});
}

export async function getClipboardIfChanged(): Promise<string | undefined> {
	const clipboardText = await getTextFromClipboard();
	return lastRequestText === clipboardText ? undefined : clipboardText;
}
