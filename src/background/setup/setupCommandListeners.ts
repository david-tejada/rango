import browser from "webextension-polyfill";
import { retrieve } from "../../common/storage";
import { promiseWrap } from "../../lib/promiseWrap";
import { type TalonAction } from "../../typings/RequestFromTalon";
import { activateTab } from "../actions/activateTab";
import { closeTab } from "../actions/closeTab";
import { closeTabsInWindow } from "../actions/closeTabsInWindow";
import { focusOrCreateTabByUrl } from "../actions/focusOrCreateTabByUrl";
import { focusPreviousTab } from "../actions/focusPreviousTab";
import {
	focusNextAudibleTab,
	focusNextMutedTab,
	focusNextTabWithSound,
	focusTabLastSounded,
} from "../actions/focusTabBySound";
import { cycleTabsByText, focusTabByText } from "../actions/focusTabByText";
import { getBareTitle } from "../actions/getBareTitle";
import {
	muteAllTabsWithSound,
	muteNextTabWithSound,
	muteTab,
	unmuteAllMutedTabs,
	unmuteNextMutedTab,
} from "../actions/muteTabs";
import { toggleHintsGlobal, updateHintsToggle } from "../actions/toggleHints";
import { toggleKeyboardClicking } from "../actions/toggleKeyboardClicking";
import { toggleTabMarkers } from "../actions/toggleTabMarkers";
import { onCommand } from "../commands/commandBroker";
import {
	sendMessage,
	sendMessagesToTargetFrames,
	sendMessageToAllFrames,
	UnreachableContentScriptError,
} from "../messaging/backgroundMessageBroker";
import { refreshTabMarkers } from "../misc/tabMarkers";
import { getCurrentTab, getCurrentTabId } from "../utils/getCurrentTab";
import { notify } from "../utils/notify";
import { discardNextResponse } from "../utils/requestAndResponse";

export function setupCommandListeners() {
	// ===========================================================================
	// NAVIGATION
	// ===========================================================================
	onCommand("historyGoBack", async () => {
		try {
			await sendMessage("historyGoBack");
		} catch (error: unknown) {
			if (!(error instanceof UnreachableContentScriptError)) {
				throw error;
			}

			await browser.tabs.goBack();
		}
	});

	onCommand("historyGoForward", async () => {
		try {
			await sendMessage("historyGoForward");
		} catch (error: unknown) {
			if (!(error instanceof UnreachableContentScriptError)) {
				throw error;
			}

			await browser.tabs.goForward();
		}
	});

	onCommand("navigateToNextPage", async () => {
		await sendMessage("navigateToNextPage");
	});

	onCommand("navigateToPreviousPage", async () => {
		await sendMessage("navigateToPreviousPage");
	});

	onCommand("navigateToPageRoot", async () => {
		await sendMessage("navigateToPageRoot");
	});

	// ===========================================================================
	// TABS
	// ===========================================================================
	onCommand("activateTab", async ({ target }) => {
		await activateTab(target);
	});

	onCommand("closeTab", async ({ target }) => {
		await closeTab(target);
	});

	onCommand("cloneCurrentTab", async () => {
		await browser.tabs.duplicate(await getCurrentTabId());
	});

	onCommand("closeNextTabsInWindow", async ({ arg }) => {
		await closeTabsInWindow("next", arg);
	});

	onCommand("closeOtherTabsInWindow", async () => {
		await closeTabsInWindow("other");
	});

	onCommand("closePreviousTabsInWindow", async ({ arg }) => {
		await closeTabsInWindow("previous", arg);
	});

	onCommand("closeTabsLeftEndInWindow", async ({ arg }) => {
		await closeTabsInWindow("leftEnd", arg);
	});

	onCommand("closeTabsRightEndInWindow", async ({ arg }) => {
		await closeTabsInWindow("rightEnd", arg);
	});

	onCommand("closeTabsToTheLeftInWindow", async () => {
		await closeTabsInWindow("left");
	});

	onCommand("closeTabsToTheRightInWindow", async () => {
		await closeTabsInWindow("right");
	});

	onCommand("copyCurrentTabMarkdownUrl", async () => {
		const bareTitle = await getBareTitle();
		const tab = await getCurrentTab();
		const markdownUrl = `[${bareTitle}](${tab.url!})`;

		await notify("Markdown link copied to the clipboard.", { type: "success" });

		return { name: "copyToClipboard", textToCopy: markdownUrl };
	});

	onCommand("copyLocationProperty", async ({ arg }) => {
		const tab = await getCurrentTab();
		const url = new URL(tab.url!);

		await notify(`Property "${arg}" copied to the clipboard.`, {
			type: "success",
		});

		return { name: "copyToClipboard", textToCopy: url[arg] };
	});

	onCommand("getBareTitle", async () => {
		const value = await getBareTitle();
		return { name: "responseValue", value };
	});

	onCommand("focusPreviousTab", async () => {
		await focusPreviousTab();
	});

	onCommand("focusTabByText", async ({ arg }) => {
		await focusTabByText(arg);
	});

	onCommand("cycleTabsByText", async ({ arg }) => {
		await cycleTabsByText(arg);
	});

	onCommand("moveCurrentTabToNewWindow", async () => {
		const tabId = await getCurrentTabId();
		await browser.windows.create({ tabId });
	});

	onCommand("openPageInNewTab", async ({ arg }) => {
		await browser.tabs.create({ url: arg });
	});

	onCommand("focusOrCreateTabByUrl", async ({ arg }) => {
		await focusOrCreateTabByUrl(arg);
	});

	onCommand("focusNextAudibleTab", async () => {
		await focusNextAudibleTab();
	});

	onCommand("focusNextMutedTab", async () => {
		await focusNextMutedTab();
	});

	onCommand("focusNextTabWithSound", async () => {
		await focusNextTabWithSound();
	});

	onCommand("focusTabLastSounded", async () => {
		await focusTabLastSounded();
	});

	onCommand("muteTab", async ({ target }) => {
		await muteTab(target);
	});

	onCommand("unmuteTab", async ({ target }) => {
		await muteTab(target, false);
	});

	onCommand("muteCurrentTab", async () => {
		await muteTab();
	});

	onCommand("unmuteCurrentTab", async () => {
		await muteTab(undefined, false);
	});

	onCommand("muteNextTabWithSound", async () => {
		await muteNextTabWithSound();
	});

	onCommand("unmuteNextMutedTab", async () => {
		await unmuteNextMutedTab();
	});

	onCommand("muteAllTabsWithSound", async () => {
		await muteAllTabsWithSound();
	});

	onCommand("unmuteAllMutedTabs", async () => {
		await unmuteAllMutedTabs();
	});

	onCommand("refreshTabMarkers", async () => {
		await refreshTabMarkers();
	});
	onCommand("toggleTabMarkers", async () => {
		await toggleTabMarkers();
	});

	// ===========================================================================
	// KEYBOARD CLICKING
	// ===========================================================================
	onCommand("toggleKeyboardClicking", toggleKeyboardClicking);

	// ===========================================================================
	// ELEMENTS
	// ===========================================================================
	function handleClickResults<T extends "clickElement" | "directClickElement">(
		values: Awaited<ReturnType<typeof sendMessagesToTargetFrames<T>>>["values"]
	) {
		const focusPage = values.find((value) => value?.focusPage);

		// We can't open multiple selects and I don't think it's safe to press keys
		// if there have been multiple things clicked.
		const isSelect = values.length === 1 && values[0]?.isSelect;

		const actions: TalonAction[] = [];
		if (focusPage) actions.push({ name: "focusPage" });
		if (isSelect)
			actions.push({
				name: "key",
				key: "alt-down",
				main: true,
			});

		return actions;
	}

	onCommand("clickElement", async ({ target }) => {
		const { values } = await sendMessagesToTargetFrames("clickElement", {
			target,
		});

		return handleClickResults(values);
	});

	onCommand("copyElementTextContent", async ({ target }) => {
		const { values } = await sendMessagesToTargetFrames(
			"getElementTextContent",
			{
				target,
				copyTooltip: true,
			}
		);
		if (values.flat().length === 0) return;

		return {
			name: "copyToClipboard",
			textToCopy: values.flat().join("\n"),
		};
	});

	onCommand("copyLink", async ({ target }) => {
		const { values } = await sendMessagesToTargetFrames("getAnchorHref", {
			target,
			copyTooltip: true,
		});
		if (values.flat().length === 0) return;

		return {
			name: "copyToClipboard",
			textToCopy: values.flat().join("\n"),
		};
	});

	onCommand("copyMarkdownLink", async ({ target }) => {
		// Todo
	});

	onCommand("directClickElement", async ({ target }) => {
		// Handle the possibility that the user might have intended to type those
		// characters.
		if (target.length === 1) {
			const directClickWithNoFocusedDocument = await retrieve(
				"directClickWithNoFocusedDocument"
			);

			if (!directClickWithNoFocusedDocument) {
				const [focusedDocument] = await promiseWrap(
					sendMessage("checkIfDocumentHasFocus")
				);

				if (!focusedDocument) {
					return { name: "typeTargetCharacters" };
				}
			}

			const directClickWhenEditing = await retrieve("directClickWhenEditing");

			if (!directClickWhenEditing) {
				const { values } = await sendMessageToAllFrames(
					"checkActiveElementIsEditable"
				);

				if (values.includes(true)) return { name: "typeTargetCharacters" };
			}
		}

		try {
			const { values } = await sendMessagesToTargetFrames(
				"directClickElement",
				{ target }
			);

			if (target.length === 1 && values[0]?.noHintFound) {
				return { name: "typeTargetCharacters" };
			}

			return handleClickResults(values);
		} catch (error: unknown) {
			if (
				target.length === 1 &&
				error instanceof UnreachableContentScriptError
			) {
				return { name: "typeTargetCharacters" };
			}

			throw error;
		}
	});

	onCommand("focusAndDeleteContents", async ({ target }) => {
		// Todo
	});

	onCommand("focusElement", async ({ target }) => {
		if (target.length > 1) {
			await notify("Only one element can be focused.", { type: "warning" });
		}

		const filteredTarget = target[0] ? [target[0]] : [];

		const { values } = await sendMessagesToTargetFrames("focusElement", {
			target: filteredTarget,
		});

		return values[0]?.focusPage ? { name: "focusPage" } : undefined;
	});

	onCommand("focusFirstInput", async () => {
		// Todo
	});
	onCommand("hoverElement", async ({ target }) => {
		// Todo
	});
	onCommand("insertToField", async ({ target, arg }) => {
		// Todo
	});
	onCommand("openInBackgroundTab", async ({ target }) => {
		// Todo
	});

	onCommand("openInNewTab", async ({ target }) => {
		const { values } = await sendMessagesToTargetFrames("getAnchorHref", {
			target,
		});

		await Promise.all(
			values
				.flat()
				.map(async (href) => browser.tabs.create({ url: href, active: false }))
		);
	});

	onCommand("setSelectionAfter", async ({ target }) => {
		// Todo
	});
	onCommand("setSelectionBefore", async ({ target }) => {
		// Todo
	});
	onCommand("showLink", async ({ target }) => {
		await sendMessagesToTargetFrames("showLink", { target });
	});
	onCommand("tryToFocusElementAndCheckIsEditable", async ({ target }) => {
		const { values } = await sendMessagesToTargetFrames(
			"tryToFocusElementAndCheckIsEditable",
			{ target }
		);

		return { name: "responseValue", value: values[0]! };
	});
	onCommand("unhoverAll", async () => {
		// Todo
	});

	// ===========================================================================
	// SCROLL
	// ===========================================================================
	onCommand("scrollDownAtElement", async () => {
		// Todo
	});
	onCommand("scrollDownLeftAside", async ({ arg }) => {
		// Todo
	});
	onCommand("scrollDownPage", async ({ arg }) => {
		// Todo
	});
	onCommand("scrollDownRightAside", async ({ arg }) => {
		// Todo
	});
	onCommand("scrollElementToBottom", async ({ target }) => {
		// Todo
	});
	onCommand("scrollElementToCenter", async ({ target }) => {
		// Todo
	});
	onCommand("scrollElementToTop", async ({ target }) => {
		// Todo
	});
	onCommand("scrollLeftAtElement", async () => {
		// Todo
	});
	onCommand("scrollLeftPage", async ({ arg }) => {
		// Todo
	});
	onCommand("scrollRightAtElement", async () => {
		// Todo
	});
	onCommand("scrollRightPage", async ({ arg }) => {
		// Todo
	});
	onCommand("scrollToPosition", async ({ arg }) => {
		// Todo
	});
	onCommand("scrollUpAtElement", async () => {
		// Todo
	});
	onCommand("scrollUpLeftAside", async ({ arg }) => {
		// Todo
	});
	onCommand("scrollUpPage", async ({ arg }) => {
		// Todo
	});
	onCommand("scrollUpRightAside", async ({ arg }) => {
		// Todo
	});
	onCommand("storeScrollPosition", async ({ arg }) => {
		// Todo
	});

	// ===========================================================================
	// CUSTOM SELECTORS
	// ===========================================================================
	onCommand("confirmSelectorsCustomization", async () => {
		// Todo
	});
	onCommand("displayExcludedHints", async () => {
		// Todo
	});
	onCommand("displayExtraHints", async () => {
		// Todo
	});
	onCommand("displayLessHints", async () => {
		// Todo
	});
	onCommand("excludeAllHints", async () => {
		// Todo
	});
	onCommand("excludeExtraSelectors", async ({ target }) => {
		// Todo
	});
	onCommand("includeExtraSelectors", async ({ target }) => {
		// Todo
	});
	onCommand("includeOrExcludeLessSelectors", async () => {
		// Todo
	});
	onCommand("includeOrExcludeMoreSelectors", async () => {
		// Todo
	});
	onCommand("resetCustomSelectors", async () => {
		// Todo
	});

	// ===========================================================================
	// TOGGLE HINTS
	// ===========================================================================
	onCommand("disableHints", async ({ arg }) => {
		await updateHintsToggle(arg, false);
	});
	onCommand("displayTogglesStatus", async () => {
		// Todo
	});
	onCommand("enableHints", async ({ arg }) => {
		await updateHintsToggle(arg, true);
	});
	onCommand("toggleHints", async () => {
		await toggleHintsGlobal();
	});
	onCommand("resetToggleLevel", async ({ arg }) => {
		await updateHintsToggle(arg);
	});

	// ===========================================================================
	// HINTS
	// ===========================================================================
	onCommand("hideHint", async ({ target }) => {
		// Todo
	});
	onCommand("refreshHints", async () => {
		// Todo
	});

	// ===========================================================================
	// SETTINGS
	// ===========================================================================
	onCommand("decreaseHintSize", async () => {
		// Todo
	});
	onCommand("increaseHintSize", async () => {
		// Todo
	});

	onCommand("openSettingsPage", async () => {
		await browser.runtime.openOptionsPage();
	});

	// ===========================================================================
	// HELPERS
	// ===========================================================================
	onCommand("checkActiveElementIsEditable", async () => {
		// Todo
	});
	onCommand("requestTimedOut", async () => {
		discardNextResponse();
		return "noResponse";
	});

	// ===========================================================================
	// REFERENCES
	// ===========================================================================
	onCommand("removeReference", async ({ arg }) => {
		// Todo
	});
	onCommand("runActionOnReference", async ({ arg, arg2 }) => {
		// Todo
	});
	onCommand("saveReference", async ({ target, arg }) => {
		// Todo
	});
	onCommand("saveReferenceForActiveElement", async ({ arg }) => {
		// Todo
	});
	onCommand("showReferences", async ({}) => {
		// Todo
	});

	// ===========================================================================
	// FUZZY SEARCH ELEMENTS
	// ===========================================================================
	onCommand("executeActionOnTextMatchedElement", async ({ actionType }) => {
		// Todo
	});
	onCommand("matchElementByText", async ({ text, prioritizeViewport }) => {
		// Todo
	});
	onCommand("runActionOnTextMatchedElement", async ({ arg, arg2, arg3 }) => {
		// Todo
	});
}
