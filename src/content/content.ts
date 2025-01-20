import "requestidlecallback-polyfill"; // eslint-disable-line import/no-unassigned-import
import browser from "webextension-polyfill";
import { handleIncomingMessage } from "./messaging/messageHandler";
import { addMessageListeners } from "./messaging/messageListeners";
import { initContentScript } from "./setup/initContentScript";

browser.runtime.onMessage.addListener(async (message) => {
	return handleIncomingMessage(message);
});

(async () => {
	try {
		addMessageListeners();
		await initContentScript();
	} catch (error: unknown) {
		console.error(error);
	}
})();
