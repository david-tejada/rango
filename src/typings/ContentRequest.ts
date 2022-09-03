import { RangoAction } from "./RangoAction";
import {
	MarkHintsAsKeyboardReachable,
	RestoreKeyboardReachableHints,
} from "./BackgroundRequest";

interface GetClipboardManifestV3 {
	type: "getClipboardManifestV3";
}
interface CopyToClipboardManifestV3 {
	type: "copyToClipboardManifestV3";
	text: string;
}
interface GetLocation {
	type: "getLocation";
}
interface UpdateHintsInTab {
	type: "updateHintsInTab";
	hints: string[];
}
interface InitKeyboardNavigation {
	type: "initKeyboardNavigation";
}
interface CheckIfDocumentHasFocus {
	type: "checkIfDocumentHasFocus";
}

export type ContentRequest =
	| RangoAction
	| GetClipboardManifestV3
	| CopyToClipboardManifestV3
	| GetLocation
	| UpdateHintsInTab
	| MarkHintsAsKeyboardReachable
	| RestoreKeyboardReachableHints
	| InitKeyboardNavigation
	| CheckIfDocumentHasFocus;
