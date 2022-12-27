interface RangoActionWithoutTargetWithoutArg {
	type:
		| "historyGoBack"
		| "historyGoForward"
		| "closeOtherTabsInWindow"
		| "closeTabsToTheLeftInWindow"
		| "closeTabsToTheRightInWindow"
		| "cloneCurrentTab"
		| "moveCurrentTabToNewWindow"
		| "focusPreviousTab"
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
		| "toggleKeyboardClicking"
		| "enableHintsNavigation"
		| "disableHintsNavigation"
		| "excludeSingleLetterHints"
		| "includeSingleLetterHints"
		| "refreshHints"
		| "refreshHintsOnIdle"
		| "updateHintsStyle"
		| "updateHintsStyleOnIdle"
		| "updateHintsEnabled"
		| "updateHintsEnabledOnIdle"
		| "enableUrlInTitle"
		| "disableUrlInTitle"
		| "increaseHintSize"
		| "decreaseHintSize"
		| "includeOrExcludeMoreSelectors"
		| "includeOrExcludeLessSelectors"
		| "confirmSelectorsCustomization"
		| "resetCustomSelectors"
		| "getHintStringsInUse";
}

interface RangoActionWithoutTargetWithStringArg {
	type:
		| "copyLocationProperty"
		| "setHintStyle"
		| "setHintWeight"
		| "enableHints"
		| "disableHints"
		| "resetToggleLevel";
	arg: string;
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
		| "openInBackgroundTab"
		| "clickElement"
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
		| "clearAndSetSelection";
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

interface RangoActionWithTargetsAndStrinArg {
	type: "insertToField";
	target: string[];
	arg: string;
}

export type RangoActionWithTarget =
	| RangoActionWithTargets
	| RangoActionWithTargetsWithOptionalNumberArg
	| RangoActionWithTargetsAndStrinArg;

export type RangoActionWithoutTarget =
	| RangoActionWithoutTargetWithoutArg
	| RangoActionWithoutTargetWithStringArg
	| RangoActionWithoutTargetWithNumberArg
	| RangoActionWithoutTargetWithOptionalNumberArg;

export type RangoAction = RangoActionWithTarget | RangoActionWithoutTarget;
