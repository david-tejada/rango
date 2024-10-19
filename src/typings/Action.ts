type ToggleLevelData = {
	arg: "everywhere" | "global" | "tab" | "host" | "page" | "now";
};

type LocationProperty =
	| "href"
	| "hostname"
	| "host"
	| "origin"
	| "pathname"
	| "port"
	| "protocol";

export type ActionMap = {
	// Navigation
	historyGoBack: {};
	historyGoForward: {};
	navigateToNextPage: {};
	navigateToPageRoot: {};
	navigateToPreviousPage: {};

	// Tabs
	activateTab: { target: string[] };
	cloneCurrentTab: {};
	closeNextTabsInWindow: { arg: number };
	closeOtherTabsInWindow: {};
	closePreviousTabsInWindow: { arg: number };
	closeTab: { target: string[] };
	closeTabsLeftEndInWindow: { arg: number };
	closeTabsRightEndInWindow: { arg: number };
	closeTabsToTheLeftInWindow: {};
	closeTabsToTheRightInWindow: {};
	copyCurrentTabMarkdownUrl: {};
	copyLocationProperty: { arg: LocationProperty };
	cycleTabsByText: { arg: number };
	focusNextAudibleTab: {};
	focusNextMutedTab: {};
	focusNextTabWithSound: {};
	focusOrCreateTabByUrl: { arg: string };
	focusPreviousTab: {};
	focusTabByText: { arg: string };
	focusTabLastSounded: {};
	getBareTitle: {};
	moveCurrentTabToNewWindow: {};
	muteAllTabsWithSound: {};
	muteCurrentTab: {};
	muteNextTabWithSound: {};
	muteTab: { target: string[] };
	openPageInNewTab: { arg: string };
	refreshTabMarkers: {};
	toggleTabMarkers: {};
	unmuteAllMutedTabs: {};
	unmuteCurrentTab: {};
	unmuteNextMutedTab: {};
	unmuteTab: { target: string[] };

	// Keyboard Clicking
	toggleKeyboardClicking: {};

	// Elements
	clickElement: { target: string[] };
	copyElementTextContent: { target: string[] };
	copyLink: { target: string[] };
	copyMarkdownLink: { target: string[] };
	directClickElement: { target: string[] };
	focusAndDeleteContents: { target: string[] };
	focusElement: { target: string[] };
	focusFirstInput: {};
	hoverElement: { target: string[] };
	insertToField: { target: string[]; arg: string };
	openInBackgroundTab: { target: string[] };
	openInNewTab: { target: string[] };
	setSelectionAfter: { target: string[] };
	setSelectionBefore: { target: string[] };
	showLink: { target: string[] };
	tryToFocusElementAndCheckIsEditable: { target: string[] };
	unhoverAll: {};

	// Scroll
	scrollDownAtElement: {};
	scrollDownLeftAside: { arg?: number };
	scrollDownPage: { arg?: number };
	scrollDownRightAside: { arg?: number };
	scrollElementToBottom: { target: string[] };
	scrollElementToCenter: { target: string[] };
	scrollElementToTop: { target: string[] };
	scrollLeftAtElement: {};
	scrollLeftPage: { arg?: number };
	scrollRightAtElement: {};
	scrollRightPage: { arg?: number };
	scrollToPosition: { arg: string };
	scrollUpAtElement: {};
	scrollUpLeftAside: { arg?: number };
	scrollUpPage: { arg?: number };
	scrollUpRightAside: { arg?: number };
	storeScrollPosition: { arg: string };

	// Custom Selectors
	confirmSelectorsCustomization: {};
	displayExcludedHints: {};
	displayExtraHints: {};
	displayLessHints: {};
	excludeAllHints: {};
	excludeExtraSelectors: { target: string[] };
	includeExtraSelectors: { target: string[] };
	includeOrExcludeLessSelectors: {};
	includeOrExcludeMoreSelectors: {};
	resetCustomSelectors: {};

	// Toggle Hints
	disableHints: ToggleLevelData;
	displayTogglesStatus: {};
	enableHints: ToggleLevelData;
	toggleHints: {};
	resetToggleLevel: ToggleLevelData;

	// Hints
	hideHint: { target: string[] };
	refreshHints: {};

	// Settings
	decreaseHintSize: {};
	increaseHintSize: {};
	openSettingsPage: {};

	// Helpers
	checkActiveElementIsEditable: {};
	requestTimedOut: {};

	// References
	removeReference: { arg: string };
	runActionOnReference: { arg: ActionWithElementTarget; arg2: string };
	saveReference: { target: string[]; arg: string };
	saveReferenceForActiveElement: { arg: string };
	showReferences: {};

	// Fuzzy Search Elements
	executeActionOnTextMatchedElement: { actionType: ActionWithElementTarget };
	matchElementByText: { text: string; prioritizeViewport: boolean };
	runActionOnTextMatchedElement: {
		arg: ActionWithElementTarget;
		arg2: string;
		arg3: boolean;
	};

	// To Be Deleted
	disableUrlInTitle: {};
	enableUrlInTitle: {};
	excludeSingleLetterHints: {};
	includeSingleLetterHints: {};
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
