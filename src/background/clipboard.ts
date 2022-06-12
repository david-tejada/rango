import {
	ClipboardResponse,
	RequestFromTalon,
	ResponseToTalon,
	ResponseToTalonVersion0,
} from "../typing/types";
import { sendRequestToActiveTab } from "./tabs-messaging";
import browser from "webextension-polyfill";

let lastRequestText: string | undefined;

function isSafari(): boolean {
	return navigator.vendor.indexOf('Apple') != -1;
}

async function getTextFromClipboard(): Promise<string | undefined> {
	if (isSafari()) {
		return browser.runtime.sendNativeMessage("", {
			request: "getTextFromClipboard"
		}).then(
			function (response: any): string {
				return response["textFromClipboard"];
			});
	}
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
	const { text } = (await sendRequestToActiveTab({
		type: "getChromiumClipboard",
	})) as ClipboardResponse;

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
