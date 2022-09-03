import { ResponseToTalon } from "../../typings/RequestFromTalon";

export const noActionResponse: ResponseToTalon = {
	type: "response",
	action: {
		type: "noAction",
	},
};

export function getCopyToClipboardResponseObject(
	text: string
): ResponseToTalon {
	return {
		type: "response",
		action: {
			type: "copyToClipboard",
			textToCopy: text,
		},
	};
}
