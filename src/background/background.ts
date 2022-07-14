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
import { handleTalonRequest } from "./commands/handleTalonRequest";

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
		await handleTalonRequest();
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
