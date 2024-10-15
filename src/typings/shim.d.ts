/* eslint-disable @typescript-eslint/consistent-type-definitions */
import type { ProtocolWithReturn } from "webext-bridge";
import type { HintsStack, CustomSelector } from "./StorageSchema";

declare module "webext-bridge" {
	export interface ProtocolMap {
		// Hints Allocator
		initStack: undefined;
		claimHints: ProtocolWithReturn<{ amount: number }, string[]>;
		reclaimHintsFromOtherFrames: ProtocolWithReturn<
			{ amount: number },
			string[]
		>;
		releaseHints: { hints: string[] };
		storeHintsInFrame: { hints: string[] };
		getHintsStackForTab: ProtocolWithReturn<undefined, HintsStack>;

		// Tabs
		openInNewTab: { url: string };
		openInBackgroundTab: { urls: string[] };
		getTabMarker: ProtocolWithReturn<undefined, string>;

		// Context
		getContentScriptContext: ProtocolWithReturn<
			undefined,
			{ tabId: number; frameId: number; currentTabId: number }
		>;
		isCurrentTab: ProtocolWithReturn<undefined, boolean>;

		// Keyboard Clicking
		clickHintInFrame: { hint: string };
		markHintsAsKeyboardReachable: { letter: string };
		restoreKeyboardReachableHints: undefined;

		// Custom Selectors
		storeCustomSelectors: { url: string; selectors: CustomSelector[] };
		resetCustomSelectors: { url: string };

		// References
		removeReference: { hostPattern: string; name: string };

		// Click
		clickElement: { hint: string };
	}
}
