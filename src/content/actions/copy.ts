import { ScriptResponse } from "../../typing/types";

export function copyToClipboardResponse(text: string): ScriptResponse {
	return {
		talonAction: {
			type: "copyToClipboard",
			textToCopy: text,
		},
	};
}
