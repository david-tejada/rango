import { type ToastOptions } from "react-toastify";
import { type CustomSelector, type HintsStack } from "./StorageSchema";

export type GetDataType<K extends keyof ProtocolMap> =
	Parameters<ProtocolMap[K]> extends { length: 0 }
		? undefined
		: Parameters<ProtocolMap[K]>[0];

export type GetReturnType<K extends keyof ProtocolMap> = ReturnType<
	ProtocolMap[K]
>;

export type ProtocolMap = {
	// Hints Allocator
	initStack: () => void;
	claimHints: (data: { amount: number }) => string[];
	reclaimHintsFromOtherFrames: (data: { amount: number }) => string[];
	releaseHints: (data: { hints: string[] }) => void;
	storeHintsInFrame: (data: { hints: string[] }) => void;
	getHintsStackForTab: () => HintsStack;
	reclaimHints: (data: { amount: number }) => string[];

	// Tabs
	openInNewTab: (data: { url: string }) => void;
	openInBackgroundTab: (data: { urls: string[] }) => void;
	getTabMarker: () => string;
	getTitleBeforeDecoration: () => string | undefined;

	// Context
	getContentScriptContext: () => {
		tabId: number;
		frameId: number;
		currentTabId: number;
	};
	isCurrentTab: () => boolean;

	// Keyboard Clicking
	clickHintInFrame: (data: { hint: string }) => void;
	markHintsAsKeyboardReachable: (data: { letter: string }) => void;
	restoreKeyboardReachableHints: () => void;

	// Custom Selectors
	storeCustomSelectors: (data: {
		url: string;
		selectors: CustomSelector[];
	}) => void;
	resetCustomSelectors: (data: { url: string }) => void;

	// References
	removeReference: (data: { hostPattern: string; name: string }) => void;

	// Navigation
	onCompleted: () => void;

	// Notifications
	displayToastNotification: (data: {
		text: string;
		options?: ToastOptions;
	}) => void;

	// ===========================================================================
	// BACKGROUND --> CONTENT SCRIPT
	// ===========================================================================
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
};
