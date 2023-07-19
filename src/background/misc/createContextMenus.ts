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
}

export async function contextMenusOnClicked({
	menuItemId,
}: browser.Menus.OnClickData) {
	if (menuItemId === "keyboard-clicking") {
		await toggleKeyboardClicking();
	}
}
