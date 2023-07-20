import browser from "webextension-polyfill";
import { urls } from "../../common/urls";
import { retrieve } from "../../common/storage";

/**
 * `browser.browserAction` for MV2 and `browser.action` for MV3.
 */
export const browserAction = browser.action
	? browser.action
	: browser.browserAction;

/**
 * Set the browserAction icon depending on wether keyboardClicking is enabled.
 */
export async function setBrowserActionIcon() {
	const keyboardClicking = await retrieve("keyboardClicking");
	const iconPath = keyboardClicking
		? urls.iconKeyboard48.pathname
		: urls.icon48.pathname;

	// I can't use await here because of a bug in Safari that makes the promise
	// to never resolve and any further code not to execute. The bug seems to be
	// fixed in recent versions of Safari (^16.4).
	void browserAction.setIcon({ path: iconPath });
}
