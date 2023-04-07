import browser from "webextension-polyfill";
import { urls } from "../../common/urls";

export function notify(title: string, message: string) {
	void browser.notifications.create("rango-notification", {
		type: "basic",
		iconUrl: urls.icon128.href,
		title,
		message,
	});
}
