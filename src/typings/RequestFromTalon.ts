import { RangoAction } from "./RangoAction";

export interface RequestFromTalon {
	version?: number;
	type: "request";
	action: RangoAction;
}

export interface TalonAction {
	name:
		| "copyToClipboard"
		| "typeTargetCharacters"
		| "key"
		| "editDelete"
		| "sleep"
		| "focusPage";
	main?: true;
	previousName?: "noHintFound" | "editDeleteAfterDelay";
	textToCopy?: string;
	text?: string;
	key?: string;
	ms?: number;
}

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
