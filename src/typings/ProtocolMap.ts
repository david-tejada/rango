import { type ToastOptions } from "react-toastify";
import { type Tabs } from "webextension-polyfill";
import { type Direction } from "./Direction";
import { type CustomSelector, type HintStack } from "./StorageSchema";
import { type ElementMark, type Target } from "./Target/Target";

type FirstParameter<T> = T extends (...args: infer P) => any ? P[0] : never;

export type MessageData<K extends keyof ProtocolMap> =
	FirstParameter<ProtocolMap[K]> extends never
		? undefined
		: FirstParameter<ProtocolMap[K]>;

export type MessageReturn<K extends keyof ProtocolMap> = ReturnType<
	ProtocolMap[K]
>;

type ProtocolMap = BackgroundBoundMessageMap & ContentBoundMessageMap;

export type BackgroundBoundMessageMap = {
	// Tabs
	isCurrentTab: () => boolean;
	getContentScriptContext: () => {
		tabId: number;
		frameId: number;
		currentTabId: number;
	};
	getTabMarker: () => string;

	// Hints Allocator
	initStack: () => void;
	claimHints: (data: { amount: number }) => string[];
	reclaimHintsFromOtherFrames: (data: { amount: number }) => string[];
	releaseHints: (data: { hints: string[] }) => void;
	storeHintsInFrame: (data: { hints: string[] }) => void;
	getHintStackForTab: () => HintStack;
	createTabs: (data: {
		createPropertiesArray: Tabs.CreateCreatePropertiesType[];
	}) => void;
	getHintsInTab: () => string[];

	// References
	removeReference: (data: { hostPattern: string; name: string }) => void;

	// Custom Selectors
	storeCustomSelectors: (data: {
		url: string;
		selectors: CustomSelector[];
	}) => void;
	resetCustomSelectors: (data: { url: string }) => void;

	// Keyboard Clicking
	clickHintInFrame: (data: { hint: string }) => void;
	markHintsAsKeyboardReachable: (data: { letter: string }) => void;
	restoreKeyboardReachableHints: () => void;
};

export type ContentBoundMessageMap = {
	// Elements
	clickElement: (data: { target: Target<ElementMark> }) => {
		isSelect?: boolean;
		focusPage?: boolean;
	} | void;
	getElementTextContent: (data: { target: Target<ElementMark> }) => string[];
	getElementMarkdownLink: (data: { target: Target<ElementMark> }) => string[];
	tryToFocusElementAndCheckIsEditable: (data: {
		target: Target<ElementMark>;
	}) => boolean;
	focusElement: (data: { target: Target<ElementMark> }) => {
		focusPage?: boolean;
	};
	showLink: (data: { target: Target<ElementMark> }) => void;
	getAnchorHref: (data: {
		target: Target<ElementMark>;
		showCopyTooltip?: boolean;
	}) => string[];
	focusFirstInput: () => void;
	hoverElement: (data: { target: Target<ElementMark> }) => void;
	unhoverAll: () => void;
	setSelectionBefore: (data: { target: Target<ElementMark> }) => void;
	setSelectionAfter: (data: { target: Target<ElementMark> }) => void;

	// Scroll
	scroll: (data: {
		dir: Direction;
		reference:
			| Target<ElementMark>
			| "page"
			| "leftAside"
			| "rightAside"
			| "repeatLast";
		factor?: number;
	}) => void;
	snapScroll: (data: {
		position: "top" | "center" | "bottom";
		target: Target<ElementMark>;
	}) => void;
	storeScrollPosition: (data: { name: string }) => void;
	scrollToPosition: (data: { name: string }) => void;

	// Hints
	reclaimHints: (data: { amount: number }) => string[];
	displayMoreOrLessHints: (data: {
		extra?: boolean;
		excluded?: boolean;
	}) => void;
	markHintsForInclusion: (data: { target: Target<ElementMark> }) => void;
	markHintsForExclusion: (data: { target: Target<ElementMark> }) => void;
	markAllHintsForExclusion: () => void;
	markHintsWithBroaderSelector: () => void;
	markHintsWithNarrowerSelector: () => void;
	customHintsConfirm: () => void;
	customHintsReset: () => void;
	hideHint: (data: { target: Target<ElementMark> }) => void;
	refreshHints: () => void;

	// References
	saveReference: (data: {
		target: Target<ElementMark>;
		referenceName: string;
	}) => void;
	showReferences: () => void;
	assertActiveReferenceInFrame: (data: { referenceName: string }) => void;
	saveReferenceForActiveElement: (data: { referenceName: string }) => void;

	// Fuzzy Text
	matchElementByText: (data: {
		text: string;
		prioritizeViewport: boolean;
	}) => number | undefined;

	// Tabs
	getTitleBeforeDecoration: () => string;
	refreshTitleDecorations: () => void;

	// Notifications
	displayToastNotification: (data: {
		text: string;
		options?: ToastOptions;
	}) => void;
	displayTogglesStatus: () => void;

	// Keyboard Clicking
	markHintsAsKeyboardReachable: (data: { letter: string }) => void;
	restoreKeyboardReachableHints: () => void;

	// Navigation
	onCompleted: () => void;
	historyGoBack: () => void;
	historyGoForward: () => void;
	navigateToNextPage: () => void;
	navigateToPreviousPage: () => void;
	navigateToPageRoot: () => void;

	// Document
	checkIfDocumentHasFocus: () => boolean;
	tryToFocusPage: () => void;
	hasActiveEditableElement: () => boolean;

	// Hint Toggles
	updateNavigationToggle: (data: { enable?: boolean }) => void;

	// Utils
	pingContentScript: () => true;
};
