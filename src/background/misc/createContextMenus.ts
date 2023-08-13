import browser from "webextension-polyfill";
import { retrieve } from "../../common/storage";
import { toggleKeyboardClicking } from "../actions/toggleKeyboardClicking";

export async function createContextMenus() {
	const keyboardClicking = await retrieve("keyboardClicking");

	const contexts: browser.Menus.ContextType[] = browser.browserAction
		? ["browser_action"]
		: ["action"];

	browser.contextMenus.create({
		id: "keyboard-clicking",
		title: "Keyboard Clicking",
		type: "checkbox",
		contexts,
		checked: keyboardClicking,
	});

	browser.contextMenus.create({
		id: "settings",
		title: "Settings",
		type: "normal",
		contexts,
	});

	browser.contextMenus.create({
		id: "help",
		title: "Help",
		type: "normal",
		contexts,
	});
}

export async function contextMenusOnClicked({
	menuItemId,
}: browser.Menus.OnClickData) {
	if (menuItemId === "keyboard-clicking") {
		await toggleKeyboardClicking();
	}

	if (menuItemId === "settings") {
		await browser.runtime.openOptionsPage();
	}

	if (menuItemId === "help") {
		await browser.tabs.create({
			url: "https://github.com/david-tejada/rango#readme",
		});
	}
}
