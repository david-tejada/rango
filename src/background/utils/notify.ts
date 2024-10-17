import browser from "webextension-polyfill";
import { type ToastOptions } from "react-toastify";
import { urls } from "../../common/urls";
import { retrieve } from "../../common/storage";
import { getCurrentTabId } from "./getCurrentTab";

export async function notify(text: string, options?: ToastOptions) {
	if (!(await retrieve("enableNotifications"))) return;

	try {
		const tabId = await getCurrentTabId();

		// Not using sendRequestToContent here to avoid dependency cycle
		await browser.tabs.sendMessage(tabId, {
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
