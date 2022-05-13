import { Message } from "../types/types";

const sandbox = document.createElement("textarea");
document.body.append(sandbox);

export async function getMessageFromClipboard(): Promise<Message> {
	let clipText: string;
	try {
		clipText = await navigator.clipboard.readText();
	} catch (error: unknown) {
		if (error instanceof DOMException) {
			clipText = getChromiumClipboard();
		}
	}

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
