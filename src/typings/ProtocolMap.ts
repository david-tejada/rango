import { type Tabs } from "webextension-polyfill";
import { type NotificationType } from "../common/createNotifier";
import { type Direction } from "./Direction";
import { type CustomSelector, type LabelStack } from "./StorageSchema";
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
	claimLabels: (data: { amount: number }) => string[];
	reclaimLabelsFromOtherFrames: (data: { amount: number }) => string[];
	releaseLabels: (data: { labels: string[] }) => void;
	storeLabelsInFrame: (data: { labels: string[] }) => void;
	getLabelStackForTab: () => LabelStack;
	createTabs: (data: {
		createPropertiesArray: Tabs.CreateCreatePropertiesType[];
	}) => void;
	getLabelsInViewport: () => string[];

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
	setSelectionBefore: (data: { target: Target<ElementMark> }) => boolean;
	setSelectionAfter: (data: { target: Target<ElementMark> }) => boolean;
	drawPattern: (data: { target: Target<ElementMark> }) => {
		left: number;
		top: number;
	};

	// Scroll
	scroll: (data: {
		region: "main" | "leftSidebar" | "rightSidebar" | "repeatLast";
		direction: Direction;
		factor?: number;
	}) => void;
	scrollAtElement: (data: {
		target: Target<ElementMark>;
		direction: Direction;
		factor?: number;
	}) => void;
	snapScroll: (data: {
		target: Target<ElementMark>;
		position: "top" | "center" | "bottom";
	}) => void;
	storeScrollPosition: (data: { name: string }) => void;
	scrollToPosition: (data: { name: string }) => void;

	// Hints
	reclaimLabels: (data: { amount: number }) => string[];
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
	getStagedSelectors: () => CustomSelector[];
	refreshCustomHints: () => void;
	hideHint: (data: { target: Target<ElementMark> }) => void;
	refreshHints: () => void;
	getLabelsInViewport: () => string[];

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
	tabDidUpdate: (data: { title?: string; url?: string }) => void;
	currentTabChanged: () => void;

	// Notifications
	displayToastNotification: (data: {
		text: string;
		type: NotificationType;
		toastId?: string;
	}) => void;
	displayTogglesStatus: (data: { force: boolean }) => void;

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
