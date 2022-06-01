type RangoActionType =
	| "clickElement"
	| "openInNewTab"
	| "copyLink"
	| "showLink"
	| "hoverElement"
	| "fixedHoverElement"
	| "unhoverAll"
	| "toggleHints"
	| "increaseHintSize"
	| "decreaseHintSize";

export interface RangoAction {
	type: RangoActionType;
	target?: string;
}

export interface RequestFromTalon {
	version?: number;
	type: "request";
	action: RangoAction;
}

export interface TalonAction {
	type: "ok" | "copyToClipboard";
	textToCopy?: string;
}

export interface ResponseToTalon {
	type: "response";
	action: TalonAction;
}

export interface TalonActionVersion0 {
	type: "ok" | "copyLink";
	target?: string;
}

export interface ResponseToTalonVersion0 {
	type: "response";
	action: TalonActionVersion0;
}

export type ContentRequest = RangoAction | InternalContentRequest;

type InternalContentRequestType =
	| "getChromiumClipboard"
	| "copyToChromiumClipboard";

export interface InternalContentRequest {
	type: InternalContentRequestType;
	text?: string;
	target?: string;
}

type BackgroundRequestType =
	| "openInNewTab"
	| "initStack"
	| "claimHints"
	| "releaseHints"
	| "releaseOrphanHints";

export interface BackgroundRequest {
	type: BackgroundRequestType;
	amount?: number;
	hints?: string[];
	url?: string;
}

export interface ScriptResponse {
	text?: string;
	talonAction?: TalonAction;
}

export interface Intersector {
	element: Element;
	hintElement?: Element;
	hintText?: string;
	isVisible: boolean;
	clickableType: string | undefined;
}

export interface Rgba {
	r: number;
	g: number;
	b: number;
	a: number;
}

export type HintsStack = {
	free: string[];
	assigned: Map<string, number>;
};

export type StorableHintsStack = {
	free: string[];
	assigned: Array<[string, number]>;
};
