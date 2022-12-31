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

interface SimpleBackgroundRequest {
	type: "initStack" | "getTabId" | "restoreKeyboardReachableHints";
}

export type BackgroundRequest =
	| SimpleBackgroundRequest
	| OpenInNewTab
	| ClaimHints
	| ReleaseHints
	| OpenInBackgroundTab
	| ClickHintInFrame
	| MarkHintsAsKeyboardReachable
	| ReclaimHintsFromOtherFrames;
