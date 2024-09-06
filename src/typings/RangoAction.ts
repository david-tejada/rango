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
		| "focusNextTabWithSound"
		| "focusTabLastSounded"
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
		| "closeNextTabsInWindow"
		| "cycleTabsByText";
	arg: number;
}

export interface RangoActionRemoveReference {
	type: "removeReference";
	arg: string;
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

export interface RangoActionWithTargets {
	type:
		| "activateTab"
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

interface RangoActionSaveReference {
	type: "saveReference";
	target: string[];
	arg: string;
}

interface RangoActionSaveReferenceForActiveElement {
	type: "saveReferenceForActiveElement";
	arg: string;
}

export interface RangoActionRunActionOnReference {
	type: "runActionOnReference";
	arg: RangoActionWithTargets["type"];
	arg2: string;
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

interface RangoActionScrollPosition {
	type: "storeScrollPosition" | "scrollToPosition";
	arg: string;
}

interface RangoActionfocusOrCreateTabByUrl {
	type: "focusOrCreateTabByUrl";
	arg: string;
}

interface RangoActionFocusTabByText {
	type: "focusTabByText";
	arg: string;
}

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
	| RangoActionWithTargetsWithOptionalNumberArg
	| RangoActionInsertToField
	| RangoActionSaveReference;

export type RangoActionWithoutTarget =
	| RangoActionWithoutTargetWithoutArg
	| RangoActionUpdateToggles
	| RangoActionWithoutTargetWithNumberArg
	| RangoActionWithoutTargetWithOptionalNumberArg
	| RangoActionSetHintStyle
	| RangoActionSetHintWeight
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

// Utilities
type RangoActionWithArg = RangoAction & { arg?: number | string };

export function hasArg(
	action: RangoActionWithArg
): action is RangoActionWithArg {
	return action.arg !== undefined;
}
