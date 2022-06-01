import browser from "webextension-polyfill";
import { ResponseToTalon } from "../typing/types";
import {
	getMessageFromClipboard,
	writeResponseToClipboard,
	getClipboardIfChanged,
} from "./clipboard";
import { dispatchCommand } from "./command-dispatcher";
import { adaptResponse } from "./adapt-response";

if (browser.action) {
	browser.action.onClicked.addListener(async () => {
		await dispatchCommand({ type: "toggleHints" });
	});
} else {
	browser.browserAction.onClicked.addListener(async () => {
		await dispatchCommand({ type: "toggleHints" });
	});
}

browser.commands.onCommand.addListener(async (internalCommand: string) => {
	if (internalCommand === "get-talon-request") {
		try {
			const request = await getMessageFromClipboard();
			const commandsThatChangeTheClipboard = new Set(["copyLink"]);
			if (
				navigator.clipboard ||
				commandsThatChangeTheClipboard.has(request.action.type)
			) {
				let response = await dispatchCommand(request.action);
				const changedClipboard = await getClipboardIfChanged();
				if (changedClipboard) {
					response = {
						type: "response",
						action: {
							type: "copyToClipboard",
							textToCopy: changedClipboard,
						},
					};
				}

				const adaptedResponse = adaptResponse(response, request.version ?? 0);
				await writeResponseToClipboard(adaptedResponse);
			} else {
				const response: ResponseToTalon = {
					type: "response",
					action: {
						type: "ok",
					},
				};
				const adaptedResponse = adaptResponse(response, request.version ?? 0);
				await writeResponseToClipboard(adaptedResponse);
				// Because of the way I had to implement copying and pasting to the clipboard in Chromium,
				// sending a response requires focusing the textarea element dedicated for it, which might
				// close popup elements or have other unintended consequences, therefore I will first send
				// the response back and then execute the command
				await dispatchCommand(request.action);
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
		await dispatchCommand({ type: "toggleHints" });
	}
});
