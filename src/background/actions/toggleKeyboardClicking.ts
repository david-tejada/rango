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
		await browser.contextMenus.update("keyboardClicking", {
			checked: keyboardClicking,
		});
	}
});
