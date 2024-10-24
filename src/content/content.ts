import "requestidlecallback-polyfill"; // eslint-disable-line import/no-unassigned-import
import browser from "webextension-polyfill";
import { handleIncomingMessage } from "./messaging/contentMessageBroker";
import { initContentScriptOrWait } from "./setup/initContentScript";
import { setupContentBoundMessageHandlers } from "./messaging/setupContentBoundMessageHandlers";

browser.runtime.onMessage.addListener(async (message) => {
	return handleIncomingMessage(message);
});

(async () => {
	try {
		setupContentBoundMessageHandlers();
		await initContentScriptOrWait();
	} catch (error: unknown) {
		console.error(error);
	}
})();
