import Color from "color";

interface RangoActionWithoutTarget {
	type:
		| "scrollUpPage"
		| "scrollDownPage"
		| "unhoverAll"
		| "copyCurrentTabMarkdownUrl"
		| "getCurrentTabUrl"
		| "toggleHints"
		| "refreshHints"
		| "enableUrlInTitle"
		| "disableUrlInTitle"
		| "fullHintsUpdate"
		| "fullHintsUpdateOnIdle"
		| "increaseHintSize"
		| "decreaseHintSize";
}

interface RangoActionWithoutTargetWithModifier {
	type:
		| "copyLocationProperty"
		| "setHintStyle"
		| "setHintWeight"
		| "enableHints"
		| "disableHints";
	modifier: string;
}

interface RangoActionWithTarget {
	type:
		| "scrollUpAtElement"
		| "scrollDownAtElement"
		| "clickElement"
		| "directClickElement"
		| "openInNewTab"
		| "copyLink"
		| "copyMarkdownLink"
		| "copyElementTextContent"
		| "showLink"
		| "hoverElement";
	target: string;
}

interface RangoActionWithMultipleTargets {
	type: "openInBackgroundTab";
	target: string[];
}

export type RangoAction =
	| RangoActionWithoutTarget
	| RangoActionWithTarget
	| RangoActionWithMultipleTargets
	| RangoActionWithoutTargetWithModifier;

export interface RequestFromTalon {
	version?: number;
	type: "request";
	action: RangoAction;
}

export interface TalonAction {
	type: "noAction" | "copyToClipboard" | "textRetrieved" | "noHintFound";
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

interface GetClipboardManifestV3 {
	type: "getClipboardManifestV3";
}

interface CopyToClipboardManifestV3 {
	type: "copyToClipboardManifestV3";
	text: string;
}

export type ContentRequest =
	| RangoAction
	| GetClipboardManifestV3
	| CopyToClipboardManifestV3;

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

export interface ClipboardResponse {
	text: string;
}

export interface ResponseWithTalonAction {
	talonAction: TalonAction;
}

export type ScriptResponse = ClipboardResponse | ResponseWithTalonAction;

export interface Intersector {
	element: Element;
	clickableType: string | undefined;
	firstTextNodeDescendant?: Text;
	hintElement?: HTMLDivElement;
	hintText?: string;
	hintAnchor?: HTMLElement;
	backgroundColor?: Color;
}

export type WindowLocationKeys =
	| "href"
	| "hostname"
	| "host"
	| "origin"
	| "pathname"
	| "port"
	| "protocol";

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
