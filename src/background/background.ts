import browser from "webextension-polyfill";
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
			let response = await dispatchCommand(request.action);
			// Because of the way I had to implement copying and pasting to the clipboard in Chromium,
			// sending a response requires focusing the textarea element dedicated for it, which might
			// close popup elements or have other unintended consequences, therefore I will only send
			// a response back when it's absolutely necessary. Even though for firefox this is not a problem,
			// I will not differentiate for simplicity
			const commandsThatRequireResponse = ["copyLink"];
			if (commandsThatRequireResponse.includes(request.action.type)) {
				console.log("Response required");
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
