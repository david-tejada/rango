import { type ToastOptions } from "react-toastify";
import { type RangoAction } from "./RangoAction";
import { type MarkHintsAsKeyboardReachable } from "./RequestFromContent";

type UpdateHintsInTab = {
	type: "updateHintsInTab";
	hints: string[];
};

type ReclaimHints = {
	type: "reclaimHints";
	amount: number;
};

type DisplayToastNotification = {
	type: "displayToastNotification";
	text: string;
	options?: ToastOptions;
};

type AllowToastNotification = {
	type: "allowToastNotification";
};

type UpdateNavigationToggle = {
	type: "updateNavigationToggle";
	enable: boolean | undefined;
};

type SimpleContentRequest = {
	type:
		| "restoreKeyboardReachableHints"
		| "checkIfDocumentHasFocus"
		| "checkContentScriptRunning"
		| "onCompleted"
		| "tryToFocusPage"
		| "getTitleBeforeDecoration"
		| "refreshTitleDecorations";
};

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
