import browser from "webextension-polyfill";
import { dispatchCommand } from "./commands/dispatchCommand";
import { initStorage } from "./utils/initStorage";
import { toggleHints } from "./actions/toggleHints";
import { toggleKeyboardClicking } from "./actions/toggleKeyboardClicking";
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
