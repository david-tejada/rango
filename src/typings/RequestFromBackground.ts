import { type RangoAction } from "./RangoAction";

type UpdateHintsInTab = {
	type: "updateHintsInTab";
	hints: string[];
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
		| "checkIfDocumentHasFocus"
		| "checkContentScriptRunning"
		| "tryToFocusPage"
		| "getTitleBeforeDecoration"
		| "refreshTitleDecorations";
};

export type RequestFromBackground = { frameId?: number } & (
	| RangoAction
	| SimpleContentRequest
	| UpdateHintsInTab
	| UpdateNavigationToggle
	| AllowToastNotification
);
