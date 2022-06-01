import browser from "webextension-polyfill";
import { ResponseToTalon, ResponseToTalonVersion0 } from "../typing/types";

function notifyToUpdate() {
	// Notify the user to update their extension
	browser.notifications
		.create("rango-notification", {
			type: "basic",
			iconUrl: browser.runtime.getURL("../assets/icon128.png"),
			title: "Update your Rango extension!",
			message:
				"Your Rango extension version is behind your rango-talon. Please update your extension",
		})
		.catch((error) => {
			console.error(error);
		});
}

export function adaptResponse(
	originalResponse: ResponseToTalon,
	requestVersion: number
): ResponseToTalon | ResponseToTalonVersion0 {
	const currentVersion = 1;
	if (requestVersion > currentVersion) {
		notifyToUpdate();
	}

	if (
		requestVersion === 0 &&
		originalResponse.action.type === "copyToClipboard" &&
		originalResponse.action.textToCopy
	) {
		return {
			type: "response",
			action: {
				type: "copyLink",
				target: originalResponse.action.textToCopy,
			},
		};
	}

	return originalResponse;
}
