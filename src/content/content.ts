import browser from "webextension-polyfill";
import { Message } from "../types/types";
import { clickElementByHint } from "./click-element";
import { hoverElementByHint, unhoverAll } from "./hover";
import { toggleHints, displayHints } from "./hints";
import { intersectingElements } from "./intersecting-elements";

browser.runtime.onMessage.addListener(async (message) => {
	if (message.text === "read-clipboard-message") {
		try {
			const request = await getMessageFromClipboard();
			handledTalonRequest(request);
		} catch (error: unknown) {
			let errorMessage = "Error: There was an error";
			if (error instanceof Error) {
				errorMessage = error.message;
			}

			console.log(errorMessage);
		}
	}
});

document.addEventListener("scroll", () => {
	displayHints(intersectingElements);
});

window.addEventListener("resize", () => {
	displayHints(intersectingElements);
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

function handledTalonRequest(request: Message) {
	if (request.action.type === "clickElementByHint") {
		clickElementByHint(request.action.target as string);
	}

	if (request.action.type === "hoverElementByHint") {
		hoverElementByHint(request.action.target as string, false);
	}

	if (request.action.type === "fixedHoverElementByHint") {
		hoverElementByHint(request.action.target as string, true);
	}

	if (request.action.type === "unhoverAll") {
		unhoverAll();
	}

	if (request.action.type === "toggleHints") {
		toggleHints();
	}
}
