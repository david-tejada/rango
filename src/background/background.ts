import browser from "webextension-polyfill";
import { getMessageFromClipboard, writeResponseToClipboard } from "./clipboard";
import { dispatchCommand } from "./command-dispatcher";
import { canonicalizeResponse } from "./canonicalize-message";

browser.browserAction.onClicked.addListener(async () => {
	await dispatchCommand({ type: "toggleHints" });
});

browser.commands.onCommand.addListener(async (internalCommand: string) => {
	if (internalCommand === "get-talon-request") {
		try {
			const request = await getMessageFromClipboard();
			const response = canonicalizeResponse(
				await dispatchCommand(request.action),
				request.version ?? 0
			);
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
