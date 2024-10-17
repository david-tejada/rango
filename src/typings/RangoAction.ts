type RangoActionWithoutTargetWithoutArgument = {
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
		| "focusNextTabWithSound"
		| "focusNextMutedTab"
		| "focusNextAudibleTab"
		| "focusTabLastSounded"
		| "muteCurrentTab"
		| "unmuteCurrentTab"
		| "muteNextTabWithSound"
		| "unmuteNextMutedTab"
		| "muteAllTabsWithSound"
		| "unmuteAllMutedTabs"
		| "unhoverAll"
		| "copyCurrentTabMarkdownUrl"
		| "getBareTitle"
		| "scrollUpAtElement"
		| "scrollDownAtElement"
		| "scrollLeftAtElement"
		| "scrollRightAtElement"
		| "displayExtraHints"
		| "displayExcludedHints"
		| "displayLessHints"
		| "toggleHints"
		| "toggleTabMarkers"
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
		| "excludeAllHints"
		| "confirmSelectorsCustomization"
		| "resetCustomSelectors"
		| "openSettingsPage"
		| "requestTimedOut"
		| "checkActiveElementIsEditable"
		| "refreshTabMarkers"
		| "showReferences";
};

export type RangoActionUpdateToggles = {
	type: "enableHints" | "disableHints" | "resetToggleLevel";
	arg: "everywhere" | "global" | "tab" | "host" | "page" | "now";
};

export type RangoActionCopyLocationProperty = {
	type: "copyLocationProperty";
	arg:
		| "href"
		| "hostname"
		| "host"
		| "origin"
		| "pathname"
		| "port"
		| "protocol";
};

type RangoActionWithoutTargetWithNumberArgument = {
	type:
		| "closeTabsLeftEndInWindow"
		| "closeTabsRightEndInWindow"
		| "closePreviousTabsInWindow"
		| "closeNextTabsInWindow"
		| "cycleTabsByText";
	arg: number;
};

export type RangoActionRemoveReference = {
	type: "removeReference";
	arg: string;
};

type RangoActionWithoutTargetWithOptionalNumberArgument = {
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
};

export type RangoActionWithTargets = {
	type:
		| "activateTab"
		| "muteTab"
		| "unmuteTab"
		| "closeTab"
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
		| "focusAndDeleteContents"
		| "hideHint";
	target: string[];
};

type RangoActionWithTargetsWithOptionalNumberArgument = {
	type:
		| "scrollUpAtElement"
		| "scrollDownAtElement"
		| "scrollLeftAtElement"
		| "scrollRightAtElement";
	target: string[];
	arg?: number;
};

type RangoActionSaveReference = {
	type: "saveReference";
	target: string[];
	arg: string;
};

type RangoActionSaveReferenceForActiveElement = {
	type: "saveReferenceForActiveElement";
	arg: string;
};

export type RangoActionRunActionOnReference = {
	type: "runActionOnReference";
	arg: RangoActionWithTargets["type"];
	arg2: string;
};

type RangoActionInsertToField = {
	type: "insertToField";
	target: string[];
	arg: string;
};

type RangoActionOpenPageInNewTab = {
	type: "openPageInNewTab";
	arg: string;
};

type RangoActionScrollPosition = {
	type: "storeScrollPosition" | "scrollToPosition";
	arg: string;
};

type RangoActionfocusOrCreateTabByUrl = {
	type: "focusOrCreateTabByUrl";
	arg: string;
};

type RangoActionFocusTabByText = {
	type: "focusTabByText";
	arg: string;
};

type RangoActionRunActionOnTextMatchedElement =
	| {
			type: "runActionOnTextMatchedElement";
			arg: RangoActionWithTargets["type"];
			arg2: string;
			arg3: boolean;
	  }
	| {
			type: "matchElementByText";
			text: string;
			prioritizeViewport: boolean;
	  }
	| {
			type: "executeActionOnTextMatchedElement";
			actionType: RangoActionWithTargets["type"];
	  };

export type RangoActionWithTarget =
	| RangoActionWithTargets
	| RangoActionWithTargetsWithOptionalNumberArgument
	| RangoActionInsertToField
	| RangoActionSaveReference;

export type RangoActionWithoutTarget =
	| RangoActionWithoutTargetWithoutArgument
	| RangoActionUpdateToggles
	| RangoActionWithoutTargetWithNumberArgument
	| RangoActionWithoutTargetWithOptionalNumberArgument
	| RangoActionCopyLocationProperty
	| RangoActionOpenPageInNewTab
	| RangoActionSaveReferenceForActiveElement
	| RangoActionRunActionOnReference
	| RangoActionRemoveReference
	| RangoActionScrollPosition
	| RangoActionfocusOrCreateTabByUrl
	| RangoActionFocusTabByText
	| RangoActionRunActionOnTextMatchedElement;

export type RangoAction = RangoActionWithTarget | RangoActionWithoutTarget;
