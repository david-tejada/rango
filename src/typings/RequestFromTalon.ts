import { RangoAction } from "./RangoAction";

export interface RequestFromTalon {
	version?: number;
	type: "request";
	action: RangoAction;
}

interface TalonActionCopyToClipboard {
	name: "copyToClipboard";
	textToCopy: string;
}

interface TalonActionTypeTargetCharacters {
	name: "typeTargetCharacters";
	previousName?: "noHintFound";
}

interface TalonActionKey {
	name: "key";
	key: string;
}

interface TalonActionEditDelete {
	name: "editDelete";
	previousName?: "editDeleteAfterDelay";
}

interface TalonActionSleep {
	name: "sleep";
	ms?: number;
}

interface TalonActionFocusPage {
	name: "focusPage";
}

interface TalonActionFocusPageAndResend {
	name: "focusPageAndResend";
}

interface TalonActionResponseValue {
	name: "responseValue";
	value: any;
}

export type TalonAction = { main?: true } & (
	| TalonActionCopyToClipboard
	| TalonActionTypeTargetCharacters
	| TalonActionKey
	| TalonActionEditDelete
	| TalonActionSleep
	| TalonActionFocusPage
	| TalonActionFocusPageAndResend
	| TalonActionResponseValue
);

export interface ResponseToTalon {
	type: "response";
	action: TalonActionLegacy;
	actions: TalonAction[];
}

export interface TalonActionLegacy {
	type:
		| "noAction"
		| "copyToClipboard"
		| "key"
		| "noHintFound"
		| "editDelete"
		| "editDeleteAfterDelay";
	textToCopy?: string;
	key?: string;
}
