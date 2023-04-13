import browser from "webextension-polyfill";
import { ToastOptions } from "react-toastify";
import { sendRequestToCurrentTab } from "../messaging/sendRequestToCurrentTab";
import { urls } from "../../common/urls";
import { retrieve } from "../../common/storage";

export async function notify(text: string, options?: ToastOptions) {
	if (!(await retrieve("enableNotifications"))) return;

	try {
		await sendRequestToCurrentTab({
			type: "displayToastNotification",
			text,
			options,
		});
	} catch {
		void browser.notifications.create("rango-notification", {
			type: "basic",
			iconUrl: urls.icon128.href,
			title: "Rango",
			message: text,
		});
	}
}

export async function notifySettingRemoved() {
	await notify(
		"This command has been removed. Update rango-talon and use the command 'rango settings' to open the settings page.",
		{
			type: "warning",
			autoClose: 8000,
		}
	);
}
