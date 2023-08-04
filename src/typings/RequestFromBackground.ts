import { ToastOptions } from "react-toastify";
import { RangoAction } from "./RangoAction";
import { MarkHintsAsKeyboardReachable } from "./RequestFromContent";

interface UpdateHintsInTab {
	type: "updateHintsInTab";
	hints: string[];
}

interface ReclaimHints {
	type: "reclaimHints";
	amount: number;
}

interface DisplayToastNotification {
	type: "displayToastNotification";
	text: string;
	options?: ToastOptions;
}

interface AllowToastNotification {
	type: "allowToastNotification";
}

interface UpdateNavigationToggle {
	type: "updateNavigationToggle";
	enable: boolean | undefined;
}

interface SimpleContentRequest {
	type:
		| "restoreKeyboardReachableHints"
		| "checkIfDocumentHasFocus"
		| "onCompleted"
		| "tryToFocusPage"
		| "getTitleBeforeDecoration"
		| "refreshTitleDecorations";
}

export type RequestFromBackground = { frameId?: number } & (
	| RangoAction
	| SimpleContentRequest
	| UpdateHintsInTab
	| MarkHintsAsKeyboardReachable
	| ReclaimHints
	| DisplayToastNotification
	| UpdateNavigationToggle
	| AllowToastNotification
);
