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
import { toggleHints } from "./toggle-hints";
import { toggleKeyboardClicking } from "./toggle-keyboard-clicking";
import { getEventListeners } from "./get-event-listeners";

initStorage().catch((error) => {
	console.error(error);
});

// This code injects the function getEventListeners into the current page in its context.
// It injects code that hijacks the methods Element.prototype.addEventListener and
// Element.prototype.removeEventListener so that we can know what elements have events attached.
// This only works for manifest v3. It's supposed to work with manifest v2 since Firefox 102,
// but in my case it didn't work.
if (browser.action) {
	browser.webNavigation.onCompleted.addListener(async ({ tabId }) => {
		await browser.scripting.executeScript({
			target: { tabId, allFrames: true },
			func: getEventListeners,
		});
	});
}

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
	if (
		internalCommand === "get-talon-request" ||
		internalCommand === "get-talon-request-legacy"
	) {
		try {
			const request = await getRequestFromClipboard();
			if (process.env["NODE_ENV"] !== "production") {
				console.log(JSON.stringify(request, null, 2));
			}

			if (!request) {
				return;
			}

			const requiresResponseValue = /^copy|^get|^direct/.test(
				request.action.type
			);

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

	if (internalCommand === "disable-hints") {
		await toggleHints("global", false);
	}

	if (internalCommand === "toggle-keyboard-clicking") {
		await toggleKeyboardClicking();
	}
});
