import { RangoAction } from "./RangoAction";
import { MarkHintsAsKeyboardReachable } from "./BackgroundRequest";

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
	| UpdateHintsInTab
	| MarkHintsAsKeyboardReachable
	| ReclaimHints;
