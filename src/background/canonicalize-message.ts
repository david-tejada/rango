import { Message } from "../types/types";

export function canonicalizeResponse(
	message: Message,
	requestVersion: number
): Message {
	const currentVersion = 1;
	if (requestVersion > currentVersion) {
		// Notify the user to update their extension
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
		version: requestVersion,
		type: "response",
		action: {
			type: actionType,
			target: actionTarget,
			textToCopy: actionTextToCopy,
		},
	};
}
