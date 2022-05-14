import browser from "webextension-polyfill";
import { getMessageFromClipboard, writeResponseToClipboard } from "./clipboard";
import { dispatchCommand } from "./command-dispatcher";

browser.browserAction.onClicked.addListener(async () => {
	await dispatchCommand({ type: "toggleHints" });
});

browser.commands.onCommand.addListener(async (internalCommand: string) => {
	if (internalCommand === "get-talon-request") {
		try {
			const request = await getMessageFromClipboard();
			const response = await dispatchCommand(request.action);
			await writeResponseToClipboard(response);
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
