import browser from "webextension-polyfill";
import { retrieve, store } from "../../common/storage";
import { toggleKeyboardClicking } from "../actions/toggleKeyboardClicking";
import { getCurrentTab } from "../utils/getCurrentTab";
import { getHostPattern } from "../../common/utils";

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

	browser.contextMenus.create({
		id: "add-keys-to-exclude",
		title: "Add Keys to Exclude",
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
			url: "https://rango.click",
		});
	}

	if (menuItemId === "add-keys-to-exclude") {
		const keysToExclude = await retrieve("keysToExclude");
		const tab = await getCurrentTab();
		const hostPattern = tab.url && getHostPattern(tab.url);
		const keysToExcludeForHost = keysToExclude.find(
			([pattern]) => pattern === hostPattern
		);

		if (!keysToExcludeForHost && hostPattern) {
			keysToExclude.push([hostPattern, ""]);
			await store("keysToExclude", keysToExclude);
		}

		await browser.runtime.openOptionsPage();
	}
}
