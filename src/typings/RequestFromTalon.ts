import { RangoAction } from "./RangoAction";

export interface RequestFromTalon {
	version?: number;
	type: "request";
	action: RangoAction;
}

export interface TalonAction {
	type:
		| "noAction"
		| "copyToClipboard"
		| "noHintFound"
		| "pressKeyArrowDown"
		| "editDelete"
		| "editDeleteAfterDelay";
	textToCopy?: string;
	text?: string;
}

export interface ResponseToTalon {
	type: "response";
	action: TalonAction;
}
interface TalonActionVersion0 {
	type: "ok" | "copyLink";
	target?: string;
}

export interface ResponseToTalonVersion0 {
	type: "response";
	action: TalonActionVersion0;
}
