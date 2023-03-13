import browser from "webextension-polyfill";
import keyboardClickingIconUrl from "url:../../assets/icon-keyboard-clicking48.png";
import defaultIconUrl from "url:../../assets/icon48.png";
import { sendRequestToAllTabs } from "../messaging/sendRequestToAllTabs";
import { retrieve, store } from "../../common/storage";

export async function toggleKeyboardClicking() {
	let keyboardClicking = await retrieve("keyboardClicking");
	keyboardClicking = !keyboardClicking;
	await store("keyboardClicking", keyboardClicking);

	if (keyboardClicking) {
		await (browser.action
			? browser.action.setIcon({ path: keyboardClickingIconUrl })
			: browser.browserAction.setIcon({ path: keyboardClickingIconUrl }));
		void sendRequestToAllTabs({ type: "initKeyboardNavigation" });
	} else {
		await (browser.action
			? browser.action.setIcon({ path: defaultIconUrl })
			: browser.browserAction.setIcon({ path: defaultIconUrl }));
	}

	const includeSingleLetterHints = await retrieve("includeSingleLetterHints");

	if (includeSingleLetterHints) {
		await sendRequestToAllTabs({ type: "refreshHints" });
	}
}
