interface RangoActionWithoutTargetWithoutArg {
	type:
		| "historyGoBack"
		| "historyGoForward"
		| "navigateToPageRoot"
		| "navigateToNextPage"
		| "navigateToPreviousPage"
		| "closeOtherTabsInWindow"
		| "closeTabsToTheLeftInWindow"
		| "closeTabsToTheRightInWindow"
		| "cloneCurrentTab"
		| "moveCurrentTabToNewWindow"
		| "focusPreviousTab"
		| "focusFirstInput"
		| "unhoverAll"
		| "copyCurrentTabMarkdownUrl"
		| "scrollUpAtElement"
		| "scrollDownAtElement"
		| "scrollLeftAtElement"
		| "scrollRightAtElement"
		| "displayExtraHints"
		| "displayExcludedHints"
		| "displayLessHints"
		| "toggleHints"
		| "displayTogglesStatus"
		| "toggleKeyboardClicking"
		| "excludeSingleLetterHints"
		| "includeSingleLetterHints"
		| "refreshHints"
		| "enableUrlInTitle"
		| "disableUrlInTitle"
		| "increaseHintSize"
		| "decreaseHintSize"
		| "includeOrExcludeMoreSelectors"
		| "includeOrExcludeLessSelectors"
		| "confirmSelectorsCustomization"
		| "resetCustomSelectors"
		| "openSettingsPage"
		| "requestTimedOut";
}

export interface RangoActionUpdateToggles {
	type: "enableHints" | "disableHints" | "resetToggleLevel";
	arg: "everywhere" | "global" | "tab" | "host" | "page" | "now";
}

export interface RangoActionCopyLocationProperty {
	type: "copyLocationProperty";
	arg:
		| "href"
		| "hostname"
		| "host"
		| "origin"
		| "pathname"
		| "port"
		| "protocol";
}

interface RangoActionSetHintStyle {
	type: "setHintStyle";
	arg: "boxed" | "subtle";
}

interface RangoActionSetHintWeight {
	type: "setHintWeight";
	arg: "auto" | "normal" | "bold";
}

interface RangoActionWithoutTargetWithNumberArg {
	type:
		| "closeTabsLeftEndInWindow"
		| "closeTabsRightEndInWindow"
		| "closePreviousTabsInWindow"
		| "closeNextTabsInWindow";
	arg: number;
}

interface RangoActionWithoutTargetWithOptionalNumberArg {
	type:
		| "scrollUpPage"
		| "scrollDownPage"
		| "scrollLeftPage"
		| "scrollRightPage"
		| "scrollUpLeftAside"
		| "scrollDownLeftAside"
		| "scrollUpRightAside"
		| "scrollDownRightAside";
	arg?: number;
}

interface RangoActionWithTargets {
	type:
		| "activateTab"
		| "openInBackgroundTab"
		| "clickElement"
		| "tryToFocusElementAndCheckIsEditable"
		| "focusElement"
		| "directClickElement"
		| "openInNewTab"
		| "copyLink"
		| "copyMarkdownLink"
		| "copyElementTextContent"
		| "showLink"
		| "hoverElement"
		| "includeExtraSelectors"
		| "excludeExtraSelectors"
		| "scrollElementToTop"
		| "scrollElementToBottom"
		| "scrollElementToCenter"
		| "setSelectionBefore"
		| "setSelectionAfter"
		| "focusAndDeleteContents";
	target: string[];
}

interface RangoActionWithTargetsWithOptionalNumberArg {
	type:
		| "scrollUpAtElement"
		| "scrollDownAtElement"
		| "scrollLeftAtElement"
		| "scrollRightAtElement";
	target: string[];
	arg?: number;
}

interface RangoActionInsertToField {
	type: "insertToField";
	target: string[];
	arg: string;
}

interface RangoActionOpenPageInNewTab {
	type: "openPageInNewTab";
	arg: string;
}

export type RangoActionWithTarget =
	| RangoActionWithTargets
	| RangoActionWithTargetsWithOptionalNumberArg
	| RangoActionInsertToField;

export type RangoActionWithoutTarget =
	| RangoActionWithoutTargetWithoutArg
	| RangoActionUpdateToggles
	| RangoActionWithoutTargetWithNumberArg
	| RangoActionWithoutTargetWithOptionalNumberArg
	| RangoActionSetHintStyle
	| RangoActionSetHintWeight
	| RangoActionCopyLocationProperty
	| RangoActionOpenPageInNewTab;

export type RangoAction = RangoActionWithTarget | RangoActionWithoutTarget;
