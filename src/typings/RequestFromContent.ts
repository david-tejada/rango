interface OpenInNewTab {
	type: "openInNewTab";
	url: string;
}
interface OpenInBackgroundTab {
	type: "openInBackgroundTab";
	links: string[];
}

interface ClaimHints {
	type: "claimHints";
	amount: number;
}

interface ReleaseHints {
	type: "releaseHints";
	hints: string[];
}

interface ClickHintInFrame {
	type: "clickHintInFrame";
	hint: string;
}

export interface MarkHintsAsKeyboardReachable {
	type: "markHintsAsKeyboardReachable";
	letter: string;
}

interface ReclaimHintsFromOtherFrames {
	type: "reclaimHintsFromOtherFrames";
	amount: number;
}

interface StoreHintsInFrame {
	type: "storeHintsInFrame";
	hints: string[];
}

interface SimpleRequestFromContent {
	type:
		| "initStack"
		| "getContentScriptContext"
		| "restoreKeyboardReachableHints"
		| "getHintsStackForTab"
		| "isCurrentTab"
		| "getTabMarker";
}

export type RequestFromContent =
	| SimpleRequestFromContent
	| OpenInNewTab
	| ClaimHints
	| ReleaseHints
	| OpenInBackgroundTab
	| ClickHintInFrame
	| MarkHintsAsKeyboardReachable
	| ReclaimHintsFromOtherFrames
	| StoreHintsInFrame;
