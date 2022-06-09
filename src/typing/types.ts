import Color from "color";

interface RangoSimpleAction {
	type:
		| "unhoverAll"
		| "toggleHints"
		| "fullHintsUpdate"
		| "fullHintsUpdateOnIdle"
		| "increaseHintSize"
		| "decreaseHintSize";
}

interface RangoActionWithTarget {
	type:
		| "clickElement"
		| "openInNewTab"
		| "copyLink"
		| "showLink"
		| "hoverElement"
		| "fixedHoverElement"
		| "setHintStyle"
		| "setHintWeight";
	target: string;
}

export type RangoAction = RangoSimpleAction | RangoActionWithTarget;

export interface RequestFromTalon {
	version?: number;
	type: "request";
	action: RangoAction;
}

export interface TalonAction {
	type: "ok" | "copyToClipboard" | "noHintFound";
	textToCopy?: string;
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

interface GetChromiumClipboardRequest {
	type: "getChromiumClipboard";
}

interface CopyToChromiumClipboardRequest {
	type: "copyToChromiumClipboard";
	text: string;
}

export type ContentRequest =
	| RangoAction
	| GetChromiumClipboardRequest
	| CopyToChromiumClipboardRequest;

interface OpenInNewTabRequest {
	type: "openInNewTab";
	url: string;
}

interface InitStackRequest {
	type: "initStack";
}

interface ClaimHintsRequest {
	type: "claimHints";
	amount: number;
}

interface ReleaseHintsRequest {
	type: "releaseHints";
	hints: string[];
}

interface ReleaseOrphanHintsRequest {
	type: "releaseOrphanHints";
	activeHints: string[];
}

export type BackgroundRequest =
	| OpenInNewTabRequest
	| InitStackRequest
	| ClaimHintsRequest
	| ReleaseHintsRequest
	| ReleaseOrphanHintsRequest;

export interface ScriptResponse {
	text?: string;
	talonAction?: TalonAction;
}

export interface Intersector {
	element: Element;
	isVisible: boolean;
	clickableType: string | undefined;
	firstTextNodeDescendant?: Text;
	hintElement?: HTMLDivElement;
	hintText?: string;
	hintAnchor?: HTMLElement;
	backgroundColor?: Color;
}

export interface HintedIntersector extends Intersector {
	hintElement: HTMLDivElement;
	hintText: string;
	clickableType: string;
}

export type HintsStack = {
	free: string[];
	assigned: Map<string, number>;
};

export type StorableHintsStack = {
	free: string[];
	assigned: Array<[string, number]>;
};

export interface FocusOnClickInput extends HTMLInputElement {
	type: Exclude<
		string,
		| "button"
		| "checkbox"
		| "color"
		| "file"
		| "hidden"
		| "image"
		| "radio"
		| "reset"
		| "submit"
	>;
}
