import browser from "webextension-polyfill";
import { toggleKeyboardClicking } from "./actions/toggleKeyboardClicking";
import { handleIncomingCommand } from "./commands/handleIncomingCommand";
import { toggleHintsGlobal, updateHintsToggle } from "./hints/toggleHints";
import { initBackgroundScript } from "./initBackgroundScript";
import { handleIncomingMessage } from "./messaging/backgroundMessageBroker";
import { contextMenusOnClicked } from "./misc/createContextMenus";
import { browserAction } from "./utils/browserAction";
import { notify } from "./utils/notify";

// We need to add the listener right away or else clicking the context menu item
// while the background script/service worker is inactive might fail.
browser.contextMenus.onClicked.addListener(contextMenusOnClicked);

(async () => {
	try {
		await initBackgroundScript();
	} catch (error: unknown) {
		console.error(error);
	}
})();

if (process.env["NODE_ENV"] === "test") {
	addEventListener("handle-test-request", handleIncomingCommand);
}

browser.runtime.onMessage.addListener(async (message, sender) =>
	handleIncomingMessage(message, sender)
);

browserAction.onClicked.addListener(async () => {
	try {
		await toggleHintsGlobal();
	} catch (error: unknown) {
		console.error(error);
		if (error instanceof Error) {
			await notify(error.message, { type: "error" });
		}
	}
});

browser.commands.onCommand.addListener(async (internalCommand: string) => {
	try {
		if (
			internalCommand === "get-talon-request" ||
			internalCommand === "get-talon-request-alternative"
		) {
			await handleIncomingCommand();
		}

		if (internalCommand === "toggle-hints") {
			await toggleHintsGlobal();
		}

		if (internalCommand === "disable-hints") {
			await updateHintsToggle("global", false);
		}

		if (internalCommand === "enable-hints") {
			await updateHintsToggle("global", true);
		}

		if (internalCommand === "toggle-keyboard-clicking") {
			await toggleKeyboardClicking();
		}
	} catch (error: unknown) {
		console.error(error);
		if (error instanceof Error) {
			await notify(error.message, { type: "error" });
		}
	}
});
