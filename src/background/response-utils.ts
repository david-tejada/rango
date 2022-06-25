import { ResponseToTalon } from "../typing/types";

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
