import { Message } from "../types/types";

let lastRequestText: string | undefined;

const sandbox = document.createElement("textarea");
document.body.append(sandbox);

async function getTextFromClipboard(): Promise<string | undefined> {
	try {
		return await navigator.clipboard.readText();
	} catch (error: unknown) {
		if (error instanceof DOMException) {
			return getChromiumClipboard();
		}

		return undefined;
	}
}

export async function getMessageFromClipboard(): Promise<Message> {
	const clipText = await getTextFromClipboard();
	lastRequestText = clipText;
	const request = JSON.parse(clipText) as Message;
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
		if (error instanceof DOMException) {
			copyToChromiumClipboard(response);
		}
	}
}

function getChromiumClipboard() {
	let result = "";
	sandbox.focus();
	if (document.execCommand("paste")) {
		result = sandbox.value;
	}

	sandbox.value = "";
	return result;
}

function copyToChromiumClipboard(text: string) {
	sandbox.value = text;
	sandbox.select();
	document.execCommand("copy");
	sandbox.value = "";
}

export async function getClipboardIfChanged(): Promise<string | undefined> {
	const clipboardText = await getTextFromClipboard();
	return lastRequestText === clipboardText ? undefined : clipboardText;
}
