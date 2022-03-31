// eslint-disable-next-line import/no-unassigned-import
import "./options-storage";
import * as browser from "webextension-polyfill";

// 	This gets triggered whenever a command is executed, it has to be on a background
// script.
browser.commands.onCommand.addListener((command) => {
	console.log(command);
	console.log("Command executed");
});

// This is the listener that gets trigger whenever a sendMessage function is
// called from the content script
browser.runtime.onMessage.addListener(async (data, sender): Promise<string> => {
	console.log("Data:\n");
	console.log(data);
	console.log("Sender:\n");
	console.log(sender);
	return "Background: Message from 'content' received";
});

browser.commands.onCommand.addListener((command) => {
	if (command === "get-talon-request") {
		navigator.clipboard
			.readText()
			.then((clipText) => {
				console.log(clipText);
				const responseObject = {
					type: "response",
					clickables: ["test"],
				};
				const response = JSON.stringify(responseObject);
				navigator.clipboard
					.writeText(response)
					.then(() => {
						console.log("Clipboard updated with response");
					})
					.catch((error) => {
						console.log(error);
					});
			})
			.catch((error) => {
				console.log(error);
			});
	}

	if (command == "insert-viewport-mark") {
		browser.tabs
			.executeScript({
				file: "insert-viewport-mark.js",
			})
			.catch((error) => {
				console.log(error);
			});
	}
});
