import browser from "webextension-polyfill";
import { ResponseToTalon } from "../typings/RequestFromTalon";
import {
	getRequestFromClipboard,
	writeResponseToClipboard,
	getClipboardIfChanged,
} from "./utils/clipboard";
import { dispatchCommand } from "./commands/dispatchCommand";
import { adaptResponse } from "./utils/adaptResponse";
import {
	getCopyToClipboardResponseObject,
	noActionResponse,
} from "./utils/responseObjects";
import { initStorage } from "./utils/initStorage";
import { toggleHints } from "./actions/toggleHints";
import { toggleKeyboardClicking } from "./actions/toggleKeyboardClicking";
import { isUnintendedDirectClicking } from "./commands/isUnintendedDirectClicking";

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

			if (await isUnintendedDirectClicking(request.action)) {
				const response: ResponseToTalon = {
					type: "response",
					action: {
						type: "noHintFound",
					},
				};

				const adaptedResponse = adaptResponse(response, request.version ?? 0);
				await writeResponseToClipboard(adaptedResponse);
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
