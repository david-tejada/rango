import * as browser from "webextension-polyfill";

// Sending a message is always done to your extension or to a different extension.
// So we send a message to an event listener on a background script.
(async () => {
	try {
		const response = (await browser.runtime.sendMessage(
			"** Message from content **"
		)) as string;
		console.log(`Response: ${response}`);
	} catch (error: unknown) {
		console.log(error);
	}
})();
