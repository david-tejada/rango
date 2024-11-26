import browser from "webextension-polyfill";
import { retrieve, store } from "../../common/storage";
import { setBrowserActionIcon } from "../utils/browserAction";

export async function toggleKeyboardClicking() {
	const keyboardClickingOld = await retrieve("keyboardClicking");
	await store("keyboardClicking", !keyboardClickingOld);
}

browser.storage.onChanged.addListener(async (changes) => {
	if ("keyboardClicking" in changes) {
		await setBrowserActionIcon();

		const keyboardClicking = await retrieve("keyboardClicking");

		try {
			await browser.contextMenus.update("keyboard-clicking", {
				checked: keyboardClicking,
			});
		} catch {
			// We ignore the error that could occur when initializing keyboardClicking
			// if the menu hasn't yet been created.
		}
	}
});
