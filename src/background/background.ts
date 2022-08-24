import browser from "webextension-polyfill";
import { dispatchCommand } from "./commands/dispatchCommand";
import { initStorage } from "./utils/initStorage";
import { toggleHints } from "./actions/toggleHints";
import { toggleKeyboardClicking } from "./actions/toggleKeyboardClicking";
import { handleTalonRequest } from "./commands/handleTalonRequest";
import { handleContentRequest } from "./messaging/handleContentRequest";
import { trackRecentTabs } from "./utils/trackRecentTabs";

initStorage()
	.then(trackRecentTabs)
	.catch((error) => {
		console.error(error);
	});

browser.runtime.onMessage.addListener(handleContentRequest);

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
