import browser from "webextension-polyfill";
import { store } from "../common/storage";
import { initBackgroundScript } from "./setup/initBackgroundScript";
import { toggleHintsGlobal, updateHintsToggle } from "./actions/toggleHints";
import { toggleKeyboardClicking } from "./actions/toggleKeyboardClicking";
import { handleRequestFromTalon } from "./messaging/handleRequestFromTalon";
import { handleRequestFromContent } from "./messaging/handleRequestFromContent";
import { sendRequestToContent } from "./messaging/sendRequestToContent";
import { browserAction } from "./utils/browserAction";
import { contextMenusOnClicked } from "./misc/createContextMenus";

// We need to add the listener right away or else clicking the context menu item
// while the background script/service worker is inactive might fail.
browser.contextMenus.onClicked.addListener(contextMenusOnClicked);

(async () => {
	await initBackgroundScript();
})();

browser.runtime.onMessage.addListener(handleRequestFromContent);

browserAction.onClicked.addListener(async () => {
	const newStatus = await toggleHintsGlobal();
	await store("includeTabMarkers", newStatus);
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
