import browser from "webextension-polyfill";
import type { RequestFromContent } from "../typings/RequestFromContent";
import { toggleHintsGlobal, updateHintsToggle } from "./actions/toggleHints";
import { toggleKeyboardClicking } from "./actions/toggleKeyboardClicking";
import { handleRequestFromContent } from "./messaging/handleRequestFromContent";
import { handleRequestFromTalon } from "./messaging/handleRequestFromTalon";
import { sendRequestToContent } from "./messaging/sendRequestToContent";
import { contextMenusOnClicked } from "./misc/createContextMenus";
import { initBackgroundScript } from "./setup/initBackgroundScript";
import { browserAction } from "./utils/browserAction";

// We need to add the listener right away or else clicking the context menu item
// while the background script/service worker is inactive might fail.
browser.contextMenus.onClicked.addListener(contextMenusOnClicked);

(async () => {
	await initBackgroundScript();
})();

addEventListener("handle-test-request", handleRequestFromTalon);

browser.runtime.onMessage.addListener(async (message, sender) => {
	return handleRequestFromContent(message as RequestFromContent, sender);
});

browserAction.onClicked.addListener(async () => {
	await toggleHintsGlobal();
});

browser.commands.onCommand.addListener(async (internalCommand: string) => {
	try {
		await sendRequestToContent({ type: "allowToastNotification" });
	} catch {
		// No content script. We do nothing.
	}

	if (
		internalCommand === "get-talon-request" ||
		internalCommand === "get-talon-request-alternative"
	) {
		await handleRequestFromTalon();
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
});
