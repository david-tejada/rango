import browser from "webextension-polyfill";
import keyboardClickingIconUrl from "url:../assets/icon-keyboard-clicking48.png";
import defaultIconUrl from "url:../assets/icon48.png";
import { sendRequestToAllTabs } from "./tabs-messaging";

export async function toggleKeyboardClicking() {
	let { keyboardClicking } = (await browser.storage.local.get([
		"keyboardClicking",
	])) as { keyboardClicking: boolean };

	keyboardClicking = !keyboardClicking;

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

	await browser.storage.local.set({
		keyboardClicking,
	});

	const { includeSingleLetterHints } = (await browser.storage.local.get([
		"includeSingleLetterHints",
	])) as { includeSingleLetterHints: boolean };

	if (includeSingleLetterHints) {
		await sendRequestToAllTabs({ type: "fullHintsUpdate" });
	}
}
