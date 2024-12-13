import browser from "webextension-polyfill";
import {
	createNotifier,
	type NotificationType,
} from "../../common/createNotifier";
import { retrieve } from "../../common/storage/storage";
import { urls } from "../../common/urls";
import {
	sendMessage,
	UnreachableContentScriptError,
} from "../messaging/backgroundMessageBroker";

/**
 * Show a notification to the user. It displays a toast notification or, in case
 * there is no content script running in the current tab, a system notification.
 */
export const notify = createNotifier(
	async (text: string, type: NotificationType, toastId?: string) => {
		if (!(await retrieve("enableNotifications"))) return;

		try {
			await sendMessage("displayToastNotification", {
				text,
				type,
				toastId,
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
);

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
