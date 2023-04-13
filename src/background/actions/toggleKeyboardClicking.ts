import browser from "webextension-polyfill";
import { retrieve, store } from "../../common/storage";
import { urls } from "../../common/urls";

export async function toggleKeyboardClicking() {
	const keyboardClicking = await retrieve("keyboardClicking");
	await store("keyboardClicking", !keyboardClicking);
}

browser.storage.onChanged.addListener(async (changes) => {
	if ("keyboardClicking" in changes) {
		const iconPath = (await retrieve("keyboardClicking"))
			? urls.iconKeyboard48.pathname
			: urls.icon48.pathname;

		await (browser.action
			? browser.action.setIcon({ path: iconPath })
			: browser.browserAction.setIcon({ path: iconPath }));
	}
});
