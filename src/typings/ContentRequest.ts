import { RangoAction } from "./RangoAction";
import { MarkHintsAsKeyboardReachable } from "./BackgroundRequest";

interface CopyToClipboardManifestV3 {
	type: "copyToClipboardManifestV3";
	text: string;
}

interface UpdateHintsInTab {
	type: "updateHintsInTab";
	hints: string[];
}

interface ReclaimHints {
	type: "reclaimHints";
	amount: number;
}

interface SimpleContentRequest {
	type:
		| "getClipboardManifestV3"
		| "getLocation"
		| "initKeyboardNavigation"
		| "restoreKeyboardReachableHints"
		| "checkIfDocumentHasFocus"
		| "getHintStringsInUse";
}

export type ContentRequest =
	| RangoAction
	| SimpleContentRequest
	| CopyToClipboardManifestV3
	| UpdateHintsInTab
	| MarkHintsAsKeyboardReachable
	| ReclaimHints;
