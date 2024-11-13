import {
	type ElementMark,
	type TabHintMark,
	type Target,
} from "./Target/Target";

export type ToggleLevel =
	| "everywhere"
	| "global"
	| "tab"
	| "host"
	| "page"
	| "now";
export type LocationProperty =
	| "href"
	| "hostname"
	| "host"
	| "origin"
	| "pathname"
	| "port"
	| "protocol";

/**
 * Relationship between the name of an action and its arguments.
 */
export type ActionMap = {
	// Navigation
	historyGoBack: void;
	historyGoForward: void;
	navigateToNextPage: void;
	navigateToPageRoot: void;
	navigateToPreviousPage: void;

	// Tabs
	activateTab: { target: Target<TabHintMark> };
	cloneCurrentTab: void;
	closeNextTabsInWindow: { amount: number };
	closeOtherTabsInWindow: void;
	closePreviousTabsInWindow: { amount: number };
	closeTab: { target: Target<TabHintMark> };
	closeTabsLeftEndInWindow: { amount: number };
	closeTabsRightEndInWindow: { amount: number };
	closeTabsToTheLeftInWindow: void;
	closeTabsToTheRightInWindow: void;
	copyCurrentTabMarkdownUrl: void;
	copyLocationProperty: { property: LocationProperty };
	cycleTabsByText: { step: number };
	focusNextAudibleTab: void;
	focusNextMutedTab: void;
	focusNextTabWithSound: void;
	focusOrCreateTabByUrl: { url: string };
	focusPreviousTab: void;
	focusTabByText: { text: string };
	focusTabLastSounded: void;
	getBareTitle: void;
	moveCurrentTabToNewWindow: void;
	muteAllTabsWithSound: void;
	muteCurrentTab: void;
	muteNextTabWithSound: void;
	muteTab: { target: Target<TabHintMark> };
	openPageInNewTab: { url: string };
	refreshTabMarkers: void;
	toggleTabMarkers: void;
	unmuteAllMutedTabs: void;
	unmuteCurrentTab: void;
	unmuteNextMutedTab: void;
	unmuteTab: { target: Target<TabHintMark> };

	// Keyboard Clicking
	toggleKeyboardClicking: void;

	// Elements
	clickElement: { target: Target<ElementMark> };
	copyElementTextContent: { target: Target<ElementMark> };
	copyLink: { target: Target<ElementMark> };
	copyMarkdownLink: { target: Target<ElementMark> };
	directClickElement: { target: Target<ElementMark> };
	focusAndDeleteContents: void;
	focusElement: { target: Target<ElementMark> };
	focusFirstInput: void;
	hoverElement: { target: Target<ElementMark> };
	insertToField: void;
	openInBackgroundTab: { target: Target<ElementMark> };
	openInNewTab: { target: Target<ElementMark> };
	setSelectionAfter: { target: Target<ElementMark> };
	setSelectionBefore: { target: Target<ElementMark> };
	showLink: { target: Target<ElementMark> };
	tryToFocusElementAndCheckIsEditable: { target: Target<ElementMark> };
	unhoverAll: void;

	// Scroll
	scrollDownAtElement: { target?: Target<ElementMark>; factor?: number };
	scrollDownLeftAside: { factor?: number };
	scrollDownPage: { factor?: number };
	scrollDownRightAside: { factor?: number };
	scrollElementToBottom: { target: Target<ElementMark> };
	scrollElementToCenter: { target: Target<ElementMark> };
	scrollElementToTop: { target: Target<ElementMark> };
	scrollLeftAtElement: { target?: Target<ElementMark>; factor?: number };
	scrollLeftPage: { factor?: number };
	scrollRightAtElement: {
		target?: Target<ElementMark>;
		factor?: number;
	};
	scrollRightPage: { factor?: number };
	scrollUpAtElement: { target?: Target<ElementMark>; factor?: number };
	scrollUpLeftAside: { factor?: number };
	scrollUpPage: { factor?: number };
	scrollUpRightAside: { factor?: number };
	storeScrollPosition: { positionName: string };
	scrollToPosition: { positionName: string };

	// Custom Selectors
	confirmSelectorsCustomization: void;
	displayExcludedHints: void;
	displayExtraHints: void;
	displayLessHints: void;
	excludeAllHints: void;
	excludeExtraSelectors: { target: Target<ElementMark> };
	includeExtraSelectors: { target: Target<ElementMark> };
	includeOrExcludeLessSelectors: void;
	includeOrExcludeMoreSelectors: void;
	resetCustomSelectors: void;

	// Toggle Hints
	disableHints: { level: ToggleLevel };
	displayTogglesStatus: void;
	enableHints: { level: ToggleLevel };
	toggleHints: void;
	resetToggleLevel: { level: ToggleLevel };

	// Hints
	hideHint: { target: Target<ElementMark> };
	refreshHints: void;

	// Settings
	decreaseHintSize: void;
	increaseHintSize: void;
	openSettingsPage: void;

	// Helpers
	checkActiveElementIsEditable: void;
	requestTimedOut: void;

	// References
	removeReference: { referenceName: string };
	runActionOnReference: void; // Not used anymore. Only necessary for command upgrading.
	saveReference: { target: Target<ElementMark>; referenceName: string };
	saveReferenceForActiveElement: { referenceName: string };
	showReferences: void;

	// Fuzzy Search Elements
	runActionOnTextMatchedElement: void; // Not used anymore. Only necessary for command upgrading.

	// To Be Deleted
	disableUrlInTitle: void;
	enableUrlInTitle: void;
	excludeSingleLetterHints: void;
	includeSingleLetterHints: void;
};

export type ActionWithElementTarget = {
	[K in keyof ActionMap]: ActionMap[K] extends {
		target: Target<ElementMark>;
	}
		? K extends `${string}Tab${string | ""}`
			? never
			: K
		: never;
}[keyof ActionMap];

export type ActionV1 = {
	type: keyof ActionMap;
	target?: string[];
	arg?: number | string | ActionWithElementTarget | LocationProperty;
	arg2?: string;
	arg3?: boolean;
};

export type ActionV2<T extends keyof ActionMap> = {
	name: keyof ActionMap;
} & ActionMap[T];

export type ActionArguments = ActionMap[keyof ActionMap];
