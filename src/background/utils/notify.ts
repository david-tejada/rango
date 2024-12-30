import browser from "webextension-polyfill";
import {
	createNotifier,
	type NotificationType,
} from "../../common/createNotifier";
import { retrieve } from "../../common/storage/storage";
import { urls } from "../../common/urls";
import { sendMessage } from "../messaging/backgroundMessageBroker";

/**
 * Show a notification to the user. It displays a toast notification or, in case
 * there is no content script running in the current tab or the current tab is
 * undefined (for example, the devtools window is focused), a system
 * notification.
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
		} catch {
			await displaySystemNotification(text);
		}
	}
);

/**
 * Display a toast notification showing the toggle levels and their status.
 *
 * @param force - If `true`, the notification will be always displayed, no matter
 * what the notification settings are.
 */
export async function notifyTogglesStatus(force = false) {
	try {
		await sendMessage("displayTogglesStatus", { force });
	} catch {
		await displaySystemNotification(
			"Unable to display the toggle status on the current page"
		);
	}
}

async function displaySystemNotification(text: string) {
	await browser.notifications.create("rango-notification", {
		type: "basic",
		iconUrl: urls.icon128.href,
		title: "Rango",
		message: text,
	});
}
