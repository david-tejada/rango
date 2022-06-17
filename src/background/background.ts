import browser from "webextension-polyfill";
import {
	getRequestFromClipboard,
	writeResponseToClipboard,
	getClipboardIfChanged,
} from "./clipboard";
import { dispatchCommand } from "./command-dispatcher";
import { adaptResponse } from "./adapt-response";
import {
	getCopyToClipboardResponseObject,
	noActionResponse,
} from "./response-utils";
import { initStorage } from "./init-storage";

initStorage().catch((error) => {
	console.error(error);
});

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
			const request = await getRequestFromClipboard();
			if (process.env["NODE_ENV"] !== "production") {
				console.log(JSON.stringify(request, null, 2));
			}

			if (!request) {
				return;
			}

			const requiresResponseValue = /^copy|^get/.test(request.action.type);

			if (navigator.clipboard || requiresResponseValue) {
				let response = await dispatchCommand(request.action);

				if (
					request.action.type === "clickElement" ||
					request.action.type === "directClickElement"
				) {
					const changedClipboard = await getClipboardIfChanged();
					response = changedClipboard
						? getCopyToClipboardResponseObject(changedClipboard)
						: response;
				}

				const adaptedResponse = adaptResponse(response, request.version ?? 0);
				await writeResponseToClipboard(adaptedResponse);
			} else {
				const adaptedResponse = adaptResponse(
					noActionResponse,
					request.version ?? 0
				);
				await writeResponseToClipboard(adaptedResponse);
				// Because of the way I had to implement copying and pasting to the clipboard in Manifest v3,
				// sending a response requires focusing the textarea element dedicated for it, which might
				// close popup elements or have other unintended consequences, therefore I will first send
				// the response back and then execute the command
				await dispatchCommand(request.action);
			}
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error(error);
			}
		}
	}

	if (internalCommand === "toggle-hints") {
		await dispatchCommand({ type: "toggleHints" });
	}
});
