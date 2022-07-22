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
interface RequestHintsProvision {
	type: "requestHintsProvision";
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
interface ClickHintInFrame {
	type: "clickHintInFrame";
	hint: string;
}

export interface MarkHintsAsKeyboardReachable {
	type: "markHintsAsKeyboardReachable";
	letter: string;
}

export interface RestoreKeyboardReachableHints {
	type: "restoreKeyboardReachableHints";
}

export type BackgroundRequest =
	| OpenInNewTab
	| InitStack
	| ClaimHints
	| RequestHintsProvision
	| ReleaseHints
	| ReleaseOrphanHints
	| OpenInBackgroundTab
	| GetTabId
	| ClickHintInFrame
	| MarkHintsAsKeyboardReachable
	| RestoreKeyboardReachableHints;
