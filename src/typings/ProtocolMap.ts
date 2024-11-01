import { type ToastOptions } from "react-toastify";
import { type Tabs } from "webextension-polyfill";
import { type CustomSelector, type HintStack } from "./StorageSchema";

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
	clickElement: (data: { target: string[] }) => {
		isSelect?: boolean;
		focusPage?: boolean;
	} | void;
	getElementTextContent: (data: { target: string[] }) => string[];
	getElementMarkdownLink: (data: { target: string[] }) => string[];
	tryToFocusElementAndCheckIsEditable: (data: { target: string[] }) => boolean;
	focusElement: (data: { target: string[] }) => { focusPage?: boolean };
	showLink: (data: { target: string[] }) => void;
	getAnchorHref: (data: {
		target: string[];
		showCopyTooltip?: boolean;
	}) => string[];
	focusFirstInput: () => void;
	hoverElement: (data: { target: string[] }) => void;
	setSelectionBefore: (data: { target: string[] }) => void;
	setSelectionAfter: (data: { target: string[] }) => void;

	// Hints
	reclaimHints: (data: { amount: number }) => string[];

	// Tabs
	getTitleBeforeDecoration: () => string;
	refreshTitleDecorations: () => void;

	// Notifications
	displayToastNotification: (data: {
		text: string;
		options?: ToastOptions;
	}) => void;
	allowToastNotification: () => void;

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
	checkActiveElementIsEditable: () => boolean;

	// Hint Toggles
	updateNavigationToggle: (data: { enable: boolean }) => void;

	// Utils
	pingContentScript: () => true;
};
