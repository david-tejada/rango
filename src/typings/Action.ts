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
	activateTab: { target: string[] };
	cloneCurrentTab: void;
	closeNextTabsInWindow: { arg: number };
	closeOtherTabsInWindow: void;
	closePreviousTabsInWindow: { arg: number };
	closeTab: { target: string[] };
	closeTabsLeftEndInWindow: { arg: number };
	closeTabsRightEndInWindow: { arg: number };
	closeTabsToTheLeftInWindow: void;
	closeTabsToTheRightInWindow: void;
	copyCurrentTabMarkdownUrl: void;
	copyLocationProperty: { arg: LocationProperty };
	cycleTabsByText: { arg: number };
	focusNextAudibleTab: void;
	focusNextMutedTab: void;
	focusNextTabWithSound: void;
	focusOrCreateTabByUrl: { arg: string };
	focusPreviousTab: void;
	focusTabByText: { arg: string };
	focusTabLastSounded: void;
	getBareTitle: void;
	moveCurrentTabToNewWindow: void;
	muteAllTabsWithSound: void;
	muteCurrentTab: void;
	muteNextTabWithSound: void;
	muteTab: { target: string[] };
	openPageInNewTab: { arg: string };
	refreshTabMarkers: void;
	toggleTabMarkers: void;
	unmuteAllMutedTabs: void;
	unmuteCurrentTab: void;
	unmuteNextMutedTab: void;
	unmuteTab: { target: string[] };

	// Keyboard Clicking
	toggleKeyboardClicking: void;

	// Elements
	clickElement: { target: string[] };
	copyElementTextContent: { target: string[] };
	copyLink: { target: string[] };
	copyMarkdownLink: { target: string[] };
	directClickElement: { target: string[] };
	focusAndDeleteContents: void;
	focusElement: { target: string[] };
	focusFirstInput: void;
	hoverElement: { target: string[] };
	insertToField: void;
	openInBackgroundTab: { target: string[] };
	openInNewTab: { target: string[] };
	setSelectionAfter: { target: string[] };
	setSelectionBefore: { target: string[] };
	showLink: { target: string[] };
	tryToFocusElementAndCheckIsEditable: { target: string[] };
	unhoverAll: void;

	// Scroll
	scrollDownAtElement: void;
	scrollDownLeftAside: { arg?: number };
	scrollDownPage: { arg?: number };
	scrollDownRightAside: { arg?: number };
	scrollElementToBottom: { target: string[] };
	scrollElementToCenter: { target: string[] };
	scrollElementToTop: { target: string[] };
	scrollLeftAtElement: void;
	scrollLeftPage: { arg?: number };
	scrollRightAtElement: void;
	scrollRightPage: { arg?: number };
	scrollToPosition: { arg: string };
	scrollUpAtElement: void;
	scrollUpLeftAside: { arg?: number };
	scrollUpPage: { arg?: number };
	scrollUpRightAside: { arg?: number };
	storeScrollPosition: { arg: string };

	// Custom Selectors
	confirmSelectorsCustomization: void;
	displayExcludedHints: void;
	displayExtraHints: void;
	displayLessHints: void;
	excludeAllHints: void;
	excludeExtraSelectors: { target: string[] };
	includeExtraSelectors: { target: string[] };
	includeOrExcludeLessSelectors: void;
	includeOrExcludeMoreSelectors: void;
	resetCustomSelectors: void;

	// Toggle Hints
	disableHints: { arg: ToggleLevel };
	displayTogglesStatus: void;
	enableHints: { arg: ToggleLevel };
	toggleHints: void;
	resetToggleLevel: { arg: ToggleLevel };

	// Hints
	hideHint: { target: string[] };
	refreshHints: void;

	// Settings
	decreaseHintSize: void;
	increaseHintSize: void;
	openSettingsPage: void;

	// Helpers
	checkActiveElementIsEditable: void;
	requestTimedOut: void;

	// References
	removeReference: { arg: string };
	runActionOnReference: { arg: ActionWithElementTarget; arg2: string };
	saveReference: { target: string[]; arg: string };
	saveReferenceForActiveElement: { arg: string };
	showReferences: void;

	// Fuzzy Search Elements
	executeActionOnTextMatchedElement: { actionType: ActionWithElementTarget };
	matchElementByText: { text: string; prioritizeViewport: boolean };
	runActionOnTextMatchedElement: {
		arg: ActionWithElementTarget;
		arg2: string;
		arg3: boolean;
	};

	// To Be Deleted
	disableUrlInTitle: void;
	enableUrlInTitle: void;
	excludeSingleLetterHints: void;
	includeSingleLetterHints: void;
};

type ActionWithElementTarget = {
	[K in keyof ActionMap]: ActionMap[K] extends {
		target: string[];
	}
		? K extends `${string}Tab${string | ""}`
			? never
			: K
		: never;
}[keyof ActionMap];

export type Action = {
	type: keyof ActionMap;
	target?: string[];
	arg?: number | string | ActionWithElementTarget | LocationProperty;
	arg2?: string;
	arg3?: boolean;
	actionType?: ActionWithElementTarget;
	prioritizeViewport?: boolean;
};

export type ActionArguments = Omit<Action, "type">;
