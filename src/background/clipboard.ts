import { Message, RequestFromTalon, ResponseToTalon } from "../types/types";
import { sendCommandToActiveTab } from "./tabs-messaging";

let lastRequestText: string | undefined;

async function getTextFromClipboard(): Promise<string | undefined> {
	if (navigator.clipboard) {
		return navigator.clipboard.readText();
	}

	return getChromiumClipboard();
}

export async function getMessageFromClipboard(): Promise<RequestFromTalon> {
	const clipText = await getTextFromClipboard();
	lastRequestText = clipText;
	if (clipText) {
		const request = JSON.parse(clipText) as RequestFromTalon;
		if (request.type !== "request") {
			throw new Error("Error: No request message present in the clipboard");
		}

		return request;
	}

	throw new Error("Error reading from the clipboard");
}

export async function writeResponseToClipboard(response: ResponseToTalon) {
	// We send the response so that talon can make sure the request was received
	// and to tell talon to execute any actions
	const jsonResponse = JSON.stringify(response);
	if (navigator.clipboard) {
		return navigator.clipboard.writeText(jsonResponse);
	}

	return copyToChromiumClipboard(jsonResponse);
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
