// eslint-disable-next-line import/no-unassigned-import
import "./options-storage.ts";
import browser from "webextension-polyfill";

browser.commands.onCommand.addListener((command) => {
	console.log(`Command: ${command}`);
});
