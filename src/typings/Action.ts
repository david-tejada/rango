import { type Direction } from "./Direction";
import {
	type ElementMark,
	type TabMarkerMark,
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
	activateTab: { target: Target<TabMarkerMark> };
	cloneCurrentTab: void;
	closeNextTabsInWindow: { amount: number };
	closeOtherTabsInWindow: void;
	closePreviousTabsInWindow: { amount: number };
	closeTab: { target: Target<TabMarkerMark> };
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
	muteTab: { target: Target<TabMarkerMark> };
	openPageInNewTab: { url: string };
	refreshTabMarkers: void;
	toggleTabMarkers: void;
	unmuteAllMutedTabs: void;
	unmuteCurrentTab: void;
	unmuteNextMutedTab: void;
	unmuteTab: { target: Target<TabMarkerMark> };

	// Keyboard Clicking
	toggleKeyboardClicking: void;

	// Elements
	clickElement: { target: Target<ElementMark> };
	copyElementTextContent: { target: Target<ElementMark> };
	copyLink: { target: Target<ElementMark> };
	copyMarkdownLink: { target: Target<ElementMark> };
	directClickElement: { target: Target<ElementMark> };
	drawLocatePattern: {
		target: Target<ElementMark>;
		colors: [number, number, number, number];
	};
	removeLocatePattern: void;
	focusAndActivateElement: { target: Target<ElementMark> };
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
	scroll: {
		direction: Direction;
		region: "main" | "leftSidebar" | "rightSidebar" | "repeatLast";
		factor?: number;
	};
	scrollAtElement: {
		target: Target<ElementMark>;
		direction: Direction;
		factor?: number;
	};
	snapScroll: {
		target: Target<ElementMark>;
		position: "top" | "center" | "bottom";
	};
	storeScrollPosition: { positionName: string };
	scrollToPosition: { positionName: string };
	// Legacy scroll actions: only necessary for command upgrading.
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
	checkActiveElementIsEditable: void; // Not used anymore. Only necessary for warning user.
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
