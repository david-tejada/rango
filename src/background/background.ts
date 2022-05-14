import browser from "webextension-polyfill";
import { Message } from "../types/types";
import { getMessageFromClipboard, writeResponseToClipboard } from "./clipboard";
import { sendMessageToActiveTab, sendMessageToAllTabs } from "./tabs-messaging";

browser.browserAction.onClicked.addListener(toggleHintsInAllTabs);

browser.commands.onCommand.addListener(async (internalCommand: string) => {
	if (internalCommand === "get-talon-request") {
		let response: Message | undefined;
		try {
			const request = await getMessageFromClipboard();
			if (request.action?.type === "toggleHints") {
				await toggleHintsInAllTabs();
				response = { type: "response", action: { type: "ok" } };
			} else {
				response = await sendMessageToActiveTab(request);
			}

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

	if (internalCommand === "toggle-hints") {
		await toggleHintsInAllTabs();
	}
});

async function toggleHintsInAllTabs() {
	try {
		const request: Message = {
			type: "request",
			action: {
				type: "toggleHints",
			},
		};
		await sendMessageToAllTabs(request);
	} catch (error: unknown) {
		let errorMessage = "Error: There was an error";
		if (error instanceof Error) {
			errorMessage = error.message;
		}

		console.error(errorMessage);
	}
}
