import browser from "webextension-polyfill";
import { Message, ResponseToTalon } from "../types/types";

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
	message: Message,
	requestVersion: number
): ResponseToTalon {
	const currentVersion = 1;
	if (requestVersion > currentVersion) {
		notifyToUpdate();
	}

	let {
		action: {
			type: actionType,
			target: actionTarget,
			textToCopy: actionTextToCopy,
		},
	} = message;

	if (requestVersion === 0 && message.action.type === "copyToClipboard") {
		actionType = "copyLink";
		actionTarget = actionTextToCopy;
	}

	return {
		type: "response",
		action: {
			type: actionType,
			target: actionTarget,
			textToCopy: actionTextToCopy,
		},
	};
}
