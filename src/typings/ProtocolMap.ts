import { type ToastOptions } from "react-toastify";
import { type Tabs } from "webextension-polyfill";
import { type CustomSelector, type HintsStack } from "./StorageSchema";

export type GetDataType<K extends keyof ProtocolMap> =
	Parameters<ProtocolMap[K]> extends { length: 0 }
		? undefined
		: Parameters<ProtocolMap[K]>[0];

export type GetReturnType<K extends keyof ProtocolMap> = ReturnType<
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
	openInNewTab: (data: { url: string }) => void;
	openInBackgroundTab: (data: { urls: string[] }) => void;
	getTabMarker: () => string;

	// Hints Allocator
	initStack: () => void;
	claimHints: (data: { amount: number }) => string[];
	reclaimHintsFromOtherFrames: (data: { amount: number }) => string[];
	releaseHints: (data: { hints: string[] }) => void;
	storeHintsInFrame: (data: { hints: string[] }) => void;
	getHintsStackForTab: () => HintsStack;
	createTabs: (data: {
		createPropertiesArray: Tabs.CreateCreatePropertiesType[];
	}) => void;

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
	directClickElement: (data: { target: string[] }) => {
		isSelect?: boolean;
		focusPage?: boolean;
		noHintFound?: boolean;
	} | void;
	copyElementTextContent: (data: { target: string[] }) => string[];

	// Hints
	reclaimHints: (data: { amount: number }) => string[];
	updateHintsInTab: (data: { hints: string[] }) => void;

	// Tabs
	getTitleBeforeDecoration: () => string | undefined;

	// Notifications
	displayToastNotification: (data: {
		text: string;
		options?: ToastOptions;
	}) => void;

	// Keyboard Clicking
	markHintsAsKeyboardReachable: (data: { letter: string }) => void;
	restoreKeyboardReachableHints: () => void;

	// Navigation
	onCompleted: () => void;
};
