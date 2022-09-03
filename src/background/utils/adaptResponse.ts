import {
	ResponseToTalon,
	ResponseToTalonVersion0,
} from "../../typings/RequestFromTalon";
import { notify } from "./notify";

export function adaptResponse(
	originalResponse: ResponseToTalon,
	requestVersion: number
): ResponseToTalon | ResponseToTalonVersion0 {
	const currentVersion = 1;
	if (requestVersion > currentVersion) {
		notify(
			"Update your Rango extension!",
			"Your Rango extension version is behind your rango-talon. Please update your extension"
		);
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
