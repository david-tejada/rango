import { type CustomSelector } from "./StorageSchema";

type OpenInNewTab = {
	type: "openInNewTab";
	url: string;
};
type OpenInBackgroundTab = {
	type: "openInBackgroundTab";
	links: string[];
};

type ClaimHints = {
	type: "claimHints";
	amount: number;
};

type ReleaseHints = {
	type: "releaseHints";
	hints: string[];
};

type ClickHintInFrame = {
	type: "clickHintInFrame";
	hint: string;
};

export type MarkHintsAsKeyboardReachable = {
	type: "markHintsAsKeyboardReachable";
	letter: string;
};

type ReclaimHintsFromOtherFrames = {
	type: "reclaimHintsFromOtherFrames";
	amount: number;
};

type StoreHintsInFrame = {
	type: "storeHintsInFrame";
	hints: string[];
};

type StoreCustomSelectors = {
	type: "storeCustomSelectors";
	url: string;
	selectors: CustomSelector[];
};

type ResetCustomSelectors = {
	type: "resetCustomSelectors";
	url: string;
};

type RemoveReference = {
	type: "removeReference";
	hostPattern: string;
	name: string;
};

type SimpleRequestFromContent = {
	type:
		| "initStack"
		| "getContentScriptContext"
		| "restoreKeyboardReachableHints"
		| "getHintStackForTab"
		| "isCurrentTab"
		| "getTabMarker";
};

export type RequestFromContent =
	| SimpleRequestFromContent
	| OpenInNewTab
	| ClaimHints
	| ReleaseHints
	| OpenInBackgroundTab
	| ClickHintInFrame
	| MarkHintsAsKeyboardReachable
	| ReclaimHintsFromOtherFrames
	| StoreHintsInFrame
	| StoreCustomSelectors
	| ResetCustomSelectors
	| RemoveReference;
