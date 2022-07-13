import browser from "webextension-polyfill";
import iconUrl from "url:../../assets/icon128.png";

export function notify(title: string, message: string) {
	void browser.notifications.create("rango-notification", {
		type: "basic",
		iconUrl,
		title,
		message,
	});
}
