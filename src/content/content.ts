import "requestidlecallback-polyfill"; // eslint-disable-line import/no-unassigned-import
import browser from "webextension-polyfill";
import { handleIncomingMessage } from "./messaging/contentMessageBroker";
import { addMessageListeners } from "./messaging/messageListeners";
import { initContentScriptOrWait } from "./setup/initContentScript";

browser.runtime.onMessage.addListener(async (message) => {
	return handleIncomingMessage(message);
});

(async () => {
	try {
		addMessageListeners();
		await initContentScriptOrWait();
	} catch (error: unknown) {
		console.error(error);
	}
})();
