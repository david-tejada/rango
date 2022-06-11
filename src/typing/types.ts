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
		| "directClickElement"
		| "openInNewTab"
		| "copyLink"
		| "showLink"
		| "hoverElement"
		| "fixedHoverElement"
		| "setHintStyle"
		| "setHintWeight";
	target: string;
}

interface RangoActionWithMultipleTargets {
	type: "openInBackgroundTab";
	target: string[];
}

export type RangoAction =
	| RangoSimpleAction
	| RangoActionWithTarget
	| RangoActionWithMultipleTargets;

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

interface GetChromiumClipboard {
	type: "getChromiumClipboard";
}

interface CopyToChromiumClipboard {
	type: "copyToChromiumClipboard";
	text: string;
}

export type ContentRequest =
	| RangoAction
	| GetChromiumClipboard
	| CopyToChromiumClipboard;

interface OpenInNewTab {
	type: "openInNewTab";
	url: string;
}

interface OpenInBackgroundTab {
	type: "openInBackgroundTab";
	links: string[];
}

interface InitStack {
	type: "initStack";
}

interface ClaimHints {
	type: "claimHints";
	amount: number;
}

interface ReleaseHints {
	type: "releaseHints";
	hints: string[];
}

interface ReleaseOrphanHints {
	type: "releaseOrphanHints";
	activeHints: string[];
}

export type BackgroundRequest =
	| OpenInNewTab
	| InitStack
	| ClaimHints
	| ReleaseHints
	| ReleaseOrphanHints
	| OpenInBackgroundTab;

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
