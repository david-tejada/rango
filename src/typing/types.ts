import Color from "color";

interface RangoActionWithoutTarget {
	type:
		| "scrollUpPage"
		| "scrollDownPage"
		| "unhoverAll"
		| "copyCurrentTabMarkdownUrl"
		| "getCurrentTabUrl"
		| "toggleHints"
		| "enableHintsNavigation"
		| "disableHintsNavigation"
		| "excludeSingleLetterHints"
		| "includeSingleLetterHints"
		| "refreshHints"
		| "enableUrlInTitle"
		| "disableUrlInTitle"
		| "fullHintsUpdate"
		| "fullHintsUpdateOnIdle"
		| "increaseHintSize"
		| "decreaseHintSize";
}

interface RangoActionWithoutTargetWithArg {
	type:
		| "copyLocationProperty"
		| "setHintStyle"
		| "setHintWeight"
		| "enableHints"
		| "disableHints"
		| "resetToggleLevel";
	arg: string;
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
	| RangoActionWithoutTargetWithArg;

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

interface GetLocation {
	type: "getLocation";
}

export type ContentRequest =
	| RangoAction
	| GetClipboardManifestV3
	| CopyToClipboardManifestV3
	| GetLocation;

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

interface GetTabId {
	type: "getTabId";
}

export type BackgroundRequest =
	| OpenInNewTab
	| InitStack
	| ClaimHints
	| ReleaseHints
	| ReleaseOrphanHints
	| OpenInBackgroundTab
	| GetTabId;

export interface ClipboardResponse {
	text: string;
}

export type ResponseWithLocation = Partial<Record<WindowLocationKeys, string>>;

export interface ResponseWithTalonAction {
	talonAction: TalonAction;
}

export type ScriptResponse =
	| ClipboardResponse
	| ResponseWithLocation
	| ResponseWithTalonAction;

export interface Intersector {
	element: Element;
	clickableType: string | undefined;
	firstTextNodeDescendant?: Text;
	hintElement?: HTMLDivElement;
	hintText?: string;
	hintAnchorRect?: DOMRect;
	hintAnchorIsText?: boolean;
	hintPlacement?: "top" | "bottom";
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

export interface HintsToggle {
	global: boolean;
	tabs: Map<number, boolean>;
	hosts: Map<string, boolean>;
	paths: Map<string, boolean>;
}

export interface StorableHintsToggle {
	global: boolean;
	tabs: Array<[number, boolean]>;
	hosts: Array<[string, boolean]>;
	paths: Array<[string, boolean]>;
}

export interface RangoOptions {
	hintFontSize: number;
	hintsToggle: HintsToggle;
	hintWeight: "auto" | "normal" | "bold";
	hintStyle: "boxed" | "subtle";
	includeSingleLetterHints: boolean;
	urlInTitle: boolean;
}

export interface StorableRangoOptions {
	hintFontSize: number;
	hintsToggle: StorableHintsToggle;
	hintWeight: "auto" | "normal" | "bold";
	hintStyle: "boxed" | "subtle";
	includeSingleLetterHints: boolean;
	urlInTitle: boolean;
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
