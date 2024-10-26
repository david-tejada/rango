import { type RangoAction } from "./RangoAction";

export type RequestFromTalon = {
	version?: number;
	type: "request";
	action: RangoAction;
};

type TalonActionCopyToClipboard = {
	name: "copyToClipboard";
	textToCopy: string;
};

type TalonActionTypeTargetCharacters = {
	name: "typeTargetCharacters";
	previousName?: "noHintFound";
};

type TalonActionKey = {
	name: "key";
	key: string;
};

type TalonActionEditDelete = {
	name: "editDelete";
	previousName?: "editDeleteAfterDelay";
};

type TalonActionSleep = {
	name: "sleep";
	ms?: number;
};

type TalonActionFocusPage = {
	name: "focusPage";
};

type TalonActionFocusPageAndResend = {
	name: "focusPageAndResend";
};

type TalonActionResponseValue = {
	name: "responseValue";
	value: any;
};

type TalonActionOpenInNewTab = {
	name: "openInNewTab";
	url: string;
};

type TalonActionPrintError = {
	name: "printError";
	message: string;
};

export type TalonAction = { main?: true } & (
	| TalonActionCopyToClipboard
	| TalonActionTypeTargetCharacters
	| TalonActionKey
	| TalonActionEditDelete
	| TalonActionSleep
	| TalonActionFocusPage
	| TalonActionFocusPageAndResend
	| TalonActionResponseValue
	| TalonActionOpenInNewTab
	| TalonActionPrintError
);

export type ResponseToTalon = {
	type: "response";
	action: TalonActionLegacy;
	actions: TalonAction[];
};

export type TalonActionLegacy = {
	type:
		| "noAction"
		| "copyToClipboard"
		| "key"
		| "noHintFound"
		| "editDelete"
		| "editDeleteAfterDelay";
	textToCopy?: string;
	key?: string;
};
