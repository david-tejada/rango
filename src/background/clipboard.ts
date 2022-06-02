import {
	RequestFromTalon,
	ResponseToTalon,
	ResponseToTalonVersion0,
} from "../typing/types";
import { sendRequestToActiveTab } from "./tabs-messaging";

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

export async function writeResponseToClipboard(
	response: ResponseToTalon | ResponseToTalonVersion0
) {
	// We send the response so that talon can make sure the request was received
	// and to tell talon to execute any actions
	const jsonResponse = JSON.stringify(response);
	if (navigator.clipboard) {
		return navigator.clipboard.writeText(jsonResponse);
	}

	return copyToChromiumClipboard(jsonResponse);
}

async function getChromiumClipboard(): Promise<string> {
	const { text } = await sendRequestToActiveTab({
		type: "getChromiumClipboard",
	});
	if (text) {
		return text;
	}

	throw new Error("Error getting Chromium clipboard");
}

async function copyToChromiumClipboard(text: string) {
	return sendRequestToActiveTab({
		type: "copyToChromiumClipboard",
		text,
	});
}

export async function getClipboardIfChanged(): Promise<string | undefined> {
	const clipboardText = await getTextFromClipboard();
	return lastRequestText === clipboardText ? undefined : clipboardText;
}
