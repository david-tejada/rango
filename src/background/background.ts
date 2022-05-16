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
