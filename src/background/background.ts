import browser from "webextension-polyfill";
import { initBackgroundScript } from "./setup/initBackgroundScript";
import { toggleHintsGlobal, updateHintsToggle } from "./actions/toggleHints";
import { toggleKeyboardClicking } from "./actions/toggleKeyboardClicking";
import { handleRequestFromTalon } from "./messaging/handleRequestFromTalon";
import { handleRequestFromContent } from "./messaging/handleRequestFromContent";
import { sendRequestToContent } from "./messaging/sendRequestToContent";

(async () => {
	await initBackgroundScript();
})();

browser.runtime.onMessage.addListener(handleRequestFromContent);

// MV2: browser.browserAction
// MV3: browser.action
(browser.browserAction ?? browser.action).onClicked.addListener(async () => {
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
