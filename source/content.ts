import * as browser from "webextension-polyfill";

// Sending a message is always done to your extension or to a different extension.
// So we send a message to an event listener on a background script.
browser.runtime
	.sendMessage("** Message from content **")
	.then((response) => {
		console.log("Response");
		console.log(response);
	})
	.catch((error) => {
		console.log(error);
	});
