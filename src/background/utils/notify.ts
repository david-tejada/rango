import { type ToastOptions } from "react-toastify";
import browser from "webextension-polyfill";
import { retrieve } from "../../common/storage/storage";
import { urls } from "../../common/urls";
import {
	sendMessage,
	UnreachableContentScriptError,
} from "../messaging/backgroundMessageBroker";

export async function notify(text: string, options?: ToastOptions) {
	if (!(await retrieve("enableNotifications"))) return;

	try {
		await sendMessage("displayToastNotification", {
			text,
			options,
		});
	} catch (error: unknown) {
		if (!(error instanceof UnreachableContentScriptError)) throw error;

		await browser.notifications.create("rango-notification", {
			type: "basic",
			iconUrl: urls.icon128.href,
			title: "Rango",
			message: text,
		});
	}
}

/**
 * Display a toast notification showing the toggle levels and their status.
 */
export async function notifyTogglesStatus() {
	try {
		await sendMessage("displayTogglesStatus");
	} catch (error: unknown) {
		if (!(error instanceof UnreachableContentScriptError)) throw error;
	}
}
