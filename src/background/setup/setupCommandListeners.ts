import browser from "webextension-polyfill";
import { retrieve } from "../../common/storage";
import { isTargetError } from "../../common/target/TargetError";
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
import { getFrameIdForHint } from "../hints/hintsAllocator";
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
import { tryToFocusDocument } from "../utils/tryToFocusDocument";

/**
 * Assert we are passing a single target. `target` must be an array of length 1.
 */
function assertSingleTarget(target: string[]): asserts target is [string] {
	if (target.length !== 1) {
		throw new Error("This command only accepts a single target.");
	}
}

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
	function handleClickResults(
		values: Awaited<
			ReturnType<typeof sendMessagesToTargetFrames<"clickElement">>
		>["values"]
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
			const { values } = await sendMessagesToTargetFrames("clickElement", {
				target,
			});

			return handleClickResults(values);
		} catch (error: unknown) {
			if (
				target.length === 1 &&
				(error instanceof UnreachableContentScriptError || isTargetError(error))
			) {
				return { name: "typeTargetCharacters" };
			}

			throw error;
		}
	});

	onCommand("copyElementTextContent", async ({ target }) => {
		const { values } = await sendMessagesToTargetFrames(
			"getElementTextContent",
			{ target }
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
			showCopyTooltip: true,
		});
		if (values.flat().length === 0) return;

		return {
			name: "copyToClipboard",
			textToCopy: values.flat().join("\n"),
		};
	});

	onCommand("copyMarkdownLink", async ({ target }) => {
		const { values } = await sendMessagesToTargetFrames(
			"getElementMarkdownLink",
			{ target }
		);
		if (values.flat().length === 0) return;

		return {
			name: "copyToClipboard",
			textToCopy: values.flat().join("\n"),
		};
	});

	// This command was changed on 2023-06-02. Remove this after April 2025.
	onCommand("focusAndDeleteContents", async () => {
		const message = `Command "focusAndDeleteContents" has been removed. Update rango-talon.`;
		await notify(message, { type: "error" });

		return { name: "printError", message };
	});

	onCommand("focusElement", async ({ target }) => {
		assertSingleTarget(target);

		const { values } = await sendMessagesToTargetFrames("focusElement", {
			target,
		});

		return values[0]?.focusPage ? { name: "focusPage" } : undefined;
	});

	onCommand("focusFirstInput", async () => {
		await sendMessage("focusFirstInput");
	});

	onCommand("hoverElement", async ({ target }) => {
		await sendMessagesToTargetFrames("hoverElement", { target });
	});

	onCommand("unhoverAll", async () => {
		await sendMessage("unhoverAll");
	});

	// This command was changed on 2023-06-02. Remove this after April 2025.
	onCommand("insertToField", async () => {
		const message = `Command "insertToField" has been removed. Update rango-talon.`;
		await notify(message, { type: "error" });

		return { name: "printError", message };
	});

	onCommand("openInBackgroundTab", async ({ target }) => {
		const { values } = await sendMessagesToTargetFrames("getAnchorHref", {
			target,
		});

		await Promise.all(
			values
				.flat()
				.map(async (url) => browser.tabs.create({ url, active: false }))
		);
	});

	onCommand("openInNewTab", async ({ target }) => {
		const { values } = await sendMessagesToTargetFrames("getAnchorHref", {
			target,
		});

		const [first, ...rest] = values.flat();
		if (first) await browser.tabs.create({ url: first, active: true });

		await Promise.all(
			rest.map(async (url) => browser.tabs.create({ url, active: false }))
		);
	});

	onCommand("setSelectionBefore", async ({ target }) => {
		assertSingleTarget(target);

		const documentHasFocus = await tryToFocusDocument();
		if (!documentHasFocus) return { name: "focusPageAndResend" };

		await sendMessagesToTargetFrames("setSelectionBefore", {
			target,
		});
		return undefined;
	});

	onCommand("setSelectionAfter", async ({ target }) => {
		assertSingleTarget(target);

		const documentHasFocus = await tryToFocusDocument();
		if (!documentHasFocus) return { name: "focusPageAndResend" };

		await sendMessagesToTargetFrames("setSelectionAfter", {
			target,
		});
		return undefined;
	});

	onCommand("tryToFocusElementAndCheckIsEditable", async ({ target }) => {
		assertSingleTarget(target);
		const documentHasFocus = await tryToFocusDocument();
		if (!documentHasFocus) return { name: "focusPageAndResend" };

		const { values } = await sendMessagesToTargetFrames(
			"tryToFocusElementAndCheckIsEditable",
			{ target }
		);

		return { name: "responseValue", value: values[0]! };
	});

	onCommand("showLink", async ({ target }) => {
		await sendMessagesToTargetFrames("showLink", { target });
	});

	// ===========================================================================
	// SCROLL
	// ===========================================================================

	let lastFrameId = 0;

	async function parseScrollTarget(target?: string[]) {
		const frameId = lastFrameId;

		if (target) {
			assertSingleTarget(target);
			const frameId = await getFrameIdForHint(target[0]);
			lastFrameId = frameId;
		}

		return { frameId, reference: target ? target[0] : "repeatLast" };
	}

	// Scroll with target
	onCommand("scrollUpAtElement", async ({ target, arg }) => {
		const { frameId, reference } = await parseScrollTarget(target);
		await sendMessage(
			"scroll",
			{ dir: "up", reference, factor: arg },
			{ frameId }
		);
	});

	onCommand("scrollDownAtElement", async ({ target, arg }) => {
		const { frameId, reference } = await parseScrollTarget(target);
		await sendMessage(
			"scroll",
			{ dir: "down", reference, factor: arg },
			{ frameId }
		);
	});

	onCommand("scrollLeftAtElement", async ({ target, arg }) => {
		const { frameId, reference } = await parseScrollTarget(target);
		await sendMessage(
			"scroll",
			{ dir: "left", reference, factor: arg },
			{ frameId }
		);
	});

	onCommand("scrollRightAtElement", async ({ target, arg }) => {
		const { frameId, reference } = await parseScrollTarget(target);
		await sendMessage(
			"scroll",
			{ dir: "right", reference, factor: arg },
			{ frameId }
		);
	});

	// Snap Scroll
	onCommand("scrollElementToTop", async ({ target }) => {
		assertSingleTarget(target);
		await sendMessagesToTargetFrames("snapScroll", {
			position: "top",
			target,
		});
	});

	onCommand("scrollElementToCenter", async ({ target }) => {
		assertSingleTarget(target);
		await sendMessagesToTargetFrames("snapScroll", {
			position: "center",
			target,
		});
	});

	onCommand("scrollElementToBottom", async ({ target }) => {
		assertSingleTarget(target);
		await sendMessagesToTargetFrames("snapScroll", {
			position: "bottom",
			target,
		});
	});

	// Scroll without target
	onCommand("scrollUpLeftAside", async ({ arg }) => {
		await sendMessage("scroll", {
			dir: "up",
			reference: "leftAside",
			factor: arg,
		});
	});

	onCommand("scrollDownLeftAside", async ({ arg }) => {
		await sendMessage("scroll", {
			dir: "down",
			reference: "leftAside",
			factor: arg,
		});
	});

	onCommand("scrollUpRightAside", async ({ arg }) => {
		await sendMessage("scroll", {
			dir: "up",
			reference: "rightAside",
			factor: arg,
		});
	});

	onCommand("scrollDownRightAside", async ({ arg }) => {
		await sendMessage("scroll", {
			dir: "down",
			reference: "rightAside",
			factor: arg,
		});
	});

	onCommand("scrollUpPage", async ({ arg }) => {
		await sendMessage("scroll", {
			dir: "up",
			reference: "page",
			factor: arg,
		});
	});

	onCommand("scrollDownPage", async ({ arg }) => {
		await sendMessage("scroll", {
			dir: "down",
			reference: "page",
			factor: arg,
		});
	});

	onCommand("scrollLeftPage", async ({ arg }) => {
		await sendMessage("scroll", {
			dir: "left",
			reference: "page",
			factor: arg,
		});
	});

	onCommand("scrollRightPage", async ({ arg }) => {
		await sendMessage("scroll", {
			dir: "right",
			reference: "page",
			factor: arg,
		});
	});

	onCommand("storeScrollPosition", async ({ arg }) => {
		await sendMessage("storeScrollPosition", { name: arg });
	});

	onCommand("scrollToPosition", async ({ arg }) => {
		await sendMessage("scrollToPosition", { name: arg });
	});

	// ===========================================================================
	// CUSTOM SELECTORS
	// ===========================================================================
	onCommand("confirmSelectorsCustomization", async () => {
		await sendMessage("customHintsConfirm");
	});

	onCommand("displayExcludedHints", async () => {
		await sendMessage("displayMoreOrLessHints", { excluded: true });
	});

	onCommand("displayExtraHints", async () => {
		await sendMessage("displayMoreOrLessHints", { extra: true });
	});

	onCommand("displayLessHints", async () => {
		await sendMessage("displayMoreOrLessHints", {
			extra: false,
			excluded: false,
		});
	});

	onCommand("excludeAllHints", async () => {
		await sendMessage("markAllHintsForExclusion");
	});

	onCommand("excludeExtraSelectors", async ({ target }) => {
		await sendMessagesToTargetFrames("markHintsForExclusion", { target });
	});

	onCommand("includeExtraSelectors", async ({ target }) => {
		await sendMessagesToTargetFrames("markHintsForInclusion", { target });
	});

	onCommand("includeOrExcludeLessSelectors", async () => {
		await sendMessage("markHintsWithNarrowerSelector");
	});

	onCommand("includeOrExcludeMoreSelectors", async () => {
		await sendMessage("markHintsWithBroaderSelector");
	});

	onCommand("resetCustomSelectors", async () => {
		await sendMessage("customHintsReset");
	});

	// ===========================================================================
	// TOGGLE HINTS
	// ===========================================================================
	onCommand("disableHints", async ({ arg }) => {
		await updateHintsToggle(arg, false);
		await sendMessage("displayTogglesStatus");
	});

	onCommand("displayTogglesStatus", async () => {
		await sendMessage("displayTogglesStatus");
	});

	onCommand("enableHints", async ({ arg }) => {
		await updateHintsToggle(arg, true);
		await sendMessage("displayTogglesStatus");
	});

	onCommand("toggleHints", async () => {
		await toggleHintsGlobal();
		await sendMessage("displayTogglesStatus");
	});

	onCommand("resetToggleLevel", async ({ arg }) => {
		await updateHintsToggle(arg);
		await sendMessage("displayTogglesStatus");
	});

	// ===========================================================================
	// HINTS
	// ===========================================================================
	onCommand("hideHint", async ({ target }) => {
		await sendMessagesToTargetFrames("hideHint", { target });
	});
	onCommand("refreshHints", async () => {
		await sendMessage("refreshHints");
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
