import browser from "webextension-polyfill";
import { getHostPattern } from "../../common/getHostPattern";
import { retrieve, store } from "../../common/storage/storage";
import { isTargetError } from "../../common/target/TargetError";
import { getTargetMarkType } from "../../common/target/targetConversion";
import { type TalonAction } from "../../typings/TalonAction";
import {
	assertPrimitiveTarget,
	type ElementMark,
	type Target,
} from "../../typings/Target/Target";
import { getFrameIdForHint } from "../hints/labels/labelStack";
import { refreshHints } from "../hints/refreshHints";
import { toggleHintsGlobal, updateHintsToggle } from "../hints/toggleHints";
import {
	UnreachableContentScriptError,
	sendMessage,
	sendMessageToAllFrames,
	sendMessageToTargetFrames,
} from "../messaging/backgroundMessageBroker";
import { toggleKeyboardClicking } from "../settings/keyboardClicking";
import { toggleTabMarkers } from "../settings/tabMarkers";
import { activateTab } from "../tabs/activateTab";
import { closeFilteredTabsInWindow } from "../tabs/closeMatchingTabsInWindow";
import { createRelatedTabs } from "../tabs/createRelatedTabs";
import { focusOrCreateTabByUrl } from "../tabs/focusOrCreateTabByUrl";
import { focusPreviousTab } from "../tabs/focusPreviousTab";
import {
	focusNextAudibleTab,
	focusNextMutedTab,
	focusNextTabWithSound,
	focusTabLastSounded,
} from "../tabs/focusTabBySound";
import { cycleTabsByText, focusTabByText } from "../tabs/focusTabByText";
import { getBareTitle } from "../tabs/getBareTitle";
import { getCurrentTab, getCurrentTabId } from "../tabs/getCurrentTab";
import {
	muteAllTabsWithSound,
	muteNextTabWithSound,
	muteTab,
	unmuteAllMutedTabs,
	unmuteNextMutedTab,
} from "../tabs/muteTabs";
import { refreshTabMarkers } from "../tabs/tabMarkers";
import { assertReferenceInCurrentTab } from "../target/references";
import { getTabIdsFromTarget } from "../target/tabMarkers";
import { getAllFrames } from "../utils/getAllFrames";
import { notify, notifyTogglesStatus } from "../utils/notify";
import { promiseWrap } from "../utils/promises";
import { withLockedStorageAccess } from "../utils/withLockedStorageValue";
import { onCommand } from "./commandBroker";
import { discardNextResponse } from "./requestAndResponse";
import { tryToFocusDocument } from "./tryToFocusDocument";

export function addCommandListeners() {
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
		const tabsToClose = await getTabIdsFromTarget(target);
		await browser.tabs.remove(tabsToClose);
	});

	onCommand("cloneCurrentTab", async () => {
		await browser.tabs.duplicate(await getCurrentTabId());
	});

	onCommand("closeNextTabsInWindow", async ({ amount }) => {
		await closeFilteredTabsInWindow(
			(tab, currentTab) =>
				tab.index > currentTab.index && tab.index <= currentTab.index + amount
		);
	});

	onCommand("closeOtherTabsInWindow", async () => {
		await closeFilteredTabsInWindow(
			(tab, currentTab) => tab.id !== currentTab.id
		);
	});

	onCommand("closePreviousTabsInWindow", async ({ amount }) => {
		await closeFilteredTabsInWindow(
			(tab, currentTab) =>
				tab.index >= currentTab.index - amount && tab.index < currentTab.index
		);
	});

	onCommand("closeTabsLeftEndInWindow", async ({ amount }) => {
		await closeFilteredTabsInWindow((tab) => tab.index < amount);
	});

	onCommand("closeTabsRightEndInWindow", async ({ amount }) => {
		await closeFilteredTabsInWindow(
			(tab, _, totalTabs) => tab.index >= totalTabs - amount
		);
	});

	onCommand("closeTabsToTheLeftInWindow", async () => {
		await closeFilteredTabsInWindow(
			(tab, currentTab) => tab.index < currentTab.index
		);
	});

	onCommand("closeTabsToTheRightInWindow", async () => {
		await closeFilteredTabsInWindow(
			(tab, currentTab) => tab.index > currentTab.index
		);
	});

	onCommand("copyCurrentTabMarkdownUrl", async () => {
		const bareTitle = await getBareTitle();
		const tab = await getCurrentTab();
		const markdownUrl = `[${bareTitle}](${tab.url!})`;

		await notify.success("Markdown link copied to the clipboard.");

		return { name: "copyToClipboard", textToCopy: markdownUrl };
	});

	onCommand("copyLocationProperty", async ({ property }) => {
		const tab = await getCurrentTab();
		const url = new URL(tab.url!);

		await notify.success(`Property "${property}" copied to the clipboard.`);

		return { name: "copyToClipboard", textToCopy: url[property] };
	});

	onCommand("getBareTitle", async () => {
		const value = await getBareTitle();
		return { name: "responseValue", value };
	});

	onCommand("focusPreviousTab", async () => {
		await focusPreviousTab();
	});

	onCommand("focusTabByText", async ({ text }) => {
		await focusTabByText(text);
	});

	onCommand("cycleTabsByText", async ({ step }) => {
		await cycleTabsByText(step);
	});

	onCommand("moveCurrentTabToNewWindow", async () => {
		const tabId = await getCurrentTabId();
		await browser.windows.create({ tabId });
	});

	onCommand("openPageInNewTab", async ({ url }) => {
		await browser.tabs.create({ url });
	});

	onCommand("focusOrCreateTabByUrl", async ({ url }) => {
		try {
			await focusOrCreateTabByUrl(url);
			return undefined;
		} catch {
			return { name: "openInNewTab", url };
		}
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
		results: Awaited<
			ReturnType<typeof sendMessageToTargetFrames<"clickElement">>
		>["results"]
	) {
		const focusPage = results.find((value) => value?.focusPage);

		// We can't open multiple selects and I don't think it's safe to press keys
		// if there have been multiple things clicked.
		const isSelect = results.length === 1 && results[0]?.isSelect;

		const actions: TalonAction[] = [];
		if (focusPage) actions.push({ name: "focusPage" });
		if (isSelect)
			actions.push({
				name: "key",
				key: "alt-down",
			});

		return actions;
	}

	onCommand("clickElement", async ({ target }) => {
		const { results } = await sendMessageToTargetFrames("clickElement", {
			target,
		});

		return handleClickResults(results);
	});

	onCommand("directClickElement", async ({ target }) => {
		// Handle the possibility that the user might have intended to type those
		// characters.
		if (target.type === "primitive") {
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
				const { results } = await sendMessageToAllFrames(
					"hasActiveEditableElement"
				);

				if (results.includes(true)) return { name: "typeTargetCharacters" };
			}
		}

		try {
			const { results } = await sendMessageToTargetFrames("clickElement", {
				target,
			});

			return handleClickResults(results);
		} catch (error: unknown) {
			if (
				target.type === "primitive" &&
				(error instanceof UnreachableContentScriptError || isTargetError(error))
			) {
				return { name: "typeTargetCharacters" };
			}

			throw error;
		}
	});

	onCommand("copyElementTextContent", async ({ target }) => {
		const { results } = await sendMessageToTargetFrames(
			"getElementTextContent",
			{ target }
		);
		if (results.flat().length === 0) return;

		return {
			name: "copyToClipboard",
			textToCopy: results.flat().join("\n"),
		};
	});

	onCommand("copyLink", async ({ target }) => {
		const { results } = await sendMessageToTargetFrames("getAnchorHref", {
			target,
			showCopyTooltip: true,
		});
		if (results.flat().length === 0) return;

		return {
			name: "copyToClipboard",
			textToCopy: results.flat().join("\n"),
		};
	});

	onCommand("copyMarkdownLink", async ({ target }) => {
		const { results } = await sendMessageToTargetFrames(
			"getElementMarkdownLink",
			{ target }
		);
		if (results.flat().length === 0) return;

		return {
			name: "copyToClipboard",
			textToCopy: results.flat().join("\n"),
		};
	});

	// This command was changed on 2023-06-02. Remove this after April 2025.
	onCommand("focusAndDeleteContents", async () => {
		const message = `Command "focusAndDeleteContents" has been removed. Update rango-talon.`;
		await notify.error(message);

		return { name: "printError", message };
	});

	onCommand("focusElement", async ({ target }) => {
		assertPrimitiveTarget(target);

		const { results } = await sendMessageToTargetFrames("focusElement", {
			target,
		});

		return results[0]?.focusPage ? { name: "focusPage" } : undefined;
	});

	onCommand("focusFirstInput", async () => {
		await sendMessage("focusFirstInput");
	});

	onCommand("hoverElement", async ({ target }) => {
		await sendMessageToTargetFrames("hoverElement", { target });
	});

	onCommand("unhoverAll", async () => {
		await sendMessageToAllFrames("unhoverAll");
	});

	// This command was changed on 2023-06-02. Remove this after April 2025.
	onCommand("insertToField", async () => {
		const message = `Command "insertToField" has been removed. Update rango-talon.`;
		await notify.error(message);

		return { name: "printError", message };
	});

	onCommand("openInBackgroundTab", async ({ target }) => {
		const { results } = await sendMessageToTargetFrames("getAnchorHref", {
			target,
		});
		if (results.flat().length === 0) {
			throw new Error("No URL to open in new tab");
		}

		await createRelatedTabs(
			results.flat().map((url) => ({ url, active: false }))
		);
	});

	onCommand("openInNewTab", async ({ target }) => {
		const { results } = await sendMessageToTargetFrames("getAnchorHref", {
			target,
		});
		const [first, ...rest] = results.flat();
		if (!first) throw new Error("No URL to open in new tab");

		await createRelatedTabs([{ url: first, active: true }]);

		const createProperties = rest.map((url) => ({ url, active: false }));
		await createRelatedTabs(createProperties);
	});

	onCommand("setSelectionBefore", async ({ target }) => {
		assertPrimitiveTarget(target);

		const documentHasFocus = await tryToFocusDocument();
		if (!documentHasFocus) return { name: "focusPageAndResend" };

		const { results } = await sendMessageToTargetFrames("setSelectionBefore", {
			target,
		});

		return results[0] ? undefined : { name: "editLineStart" };
	});

	onCommand("setSelectionAfter", async ({ target }) => {
		assertPrimitiveTarget(target);

		const documentHasFocus = await tryToFocusDocument();
		if (!documentHasFocus) return { name: "focusPageAndResend" };

		const { results } = await sendMessageToTargetFrames("setSelectionAfter", {
			target,
		});

		return results[0] ? undefined : { name: "editLineEnd" };
	});

	onCommand("tryToFocusElementAndCheckIsEditable", async ({ target }) => {
		assertPrimitiveTarget(target);
		const documentHasFocus = await tryToFocusDocument();
		if (!documentHasFocus) return { name: "focusPageAndResend" };

		const { results } = await sendMessageToTargetFrames(
			"tryToFocusElementAndCheckIsEditable",
			{ target }
		);

		return { name: "responseValue", value: results[0]! };
	});

	onCommand("showLink", async ({ target }) => {
		await sendMessageToTargetFrames("showLink", { target });
	});

	// ===========================================================================
	// SCROLL
	// ===========================================================================

	let lastFrameId = 0;

	async function parseScrollTarget(target?: Target<ElementMark>) {
		if (!target) {
			return {
				frameId: lastFrameId,
				reference: "repeatLast" as const,
			};
		}

		assertPrimitiveTarget(target);
		if (getTargetMarkType(target) !== "elementHint") {
			throw new Error("Expected element hint");
		}

		const tabId = await getCurrentTabId();
		const frameId = await getFrameIdForHint(target.mark.value, tabId);
		lastFrameId = frameId;

		return { frameId, reference: target };
	}

	// Scroll with target
	onCommand("scrollUpAtElement", async ({ target, factor }) => {
		const { frameId, reference } = await parseScrollTarget(target);
		await sendMessage("scroll", { dir: "up", reference, factor }, { frameId });
	});

	onCommand("scrollDownAtElement", async ({ target, factor }) => {
		const { frameId, reference } = await parseScrollTarget(target);
		await sendMessage(
			"scroll",
			{ dir: "down", reference, factor },
			{ frameId }
		);
	});

	onCommand("scrollLeftAtElement", async ({ target, factor }) => {
		const { frameId, reference } = await parseScrollTarget(target);
		await sendMessage(
			"scroll",
			{ dir: "left", reference, factor },
			{ frameId }
		);
	});

	onCommand("scrollRightAtElement", async ({ target, factor }) => {
		const { frameId, reference } = await parseScrollTarget(target);
		await sendMessage(
			"scroll",
			{ dir: "right", reference, factor },
			{ frameId }
		);
	});

	// Snap Scroll
	onCommand("scrollElementToTop", async ({ target }) => {
		assertPrimitiveTarget(target);
		await sendMessageToTargetFrames("snapScroll", {
			position: "top",
			target,
		});
	});

	onCommand("scrollElementToCenter", async ({ target }) => {
		assertPrimitiveTarget(target);
		await sendMessageToTargetFrames("snapScroll", {
			position: "center",
			target,
		});
	});

	onCommand("scrollElementToBottom", async ({ target }) => {
		assertPrimitiveTarget(target);
		await sendMessageToTargetFrames("snapScroll", {
			position: "bottom",
			target,
		});
	});

	// Scroll without target
	onCommand("scrollUpLeftAside", async ({ factor }) => {
		await sendMessage("scroll", {
			dir: "up",
			reference: "leftAside",
			factor,
		});
	});

	onCommand("scrollDownLeftAside", async ({ factor }) => {
		await sendMessage("scroll", {
			dir: "down",
			reference: "leftAside",
			factor,
		});
	});

	onCommand("scrollUpRightAside", async ({ factor }) => {
		await sendMessage("scroll", {
			dir: "up",
			reference: "rightAside",
			factor,
		});
	});

	onCommand("scrollDownRightAside", async ({ factor }) => {
		await sendMessage("scroll", {
			dir: "down",
			reference: "rightAside",
			factor,
		});
	});

	onCommand("scrollUpPage", async ({ factor }) => {
		await sendMessage("scroll", {
			dir: "up",
			reference: "page",
			factor,
		});
	});

	onCommand("scrollDownPage", async ({ factor }) => {
		await sendMessage("scroll", {
			dir: "down",
			reference: "page",
			factor,
		});
	});

	onCommand("scrollLeftPage", async ({ factor }) => {
		await sendMessage("scroll", {
			dir: "left",
			reference: "page",
			factor,
		});
	});

	onCommand("scrollRightPage", async ({ factor }) => {
		await sendMessage("scroll", {
			dir: "right",
			reference: "page",
			factor,
		});
	});

	onCommand("storeScrollPosition", async ({ positionName }) => {
		await sendMessage("storeScrollPosition", { name: positionName });
	});

	onCommand("scrollToPosition", async ({ positionName }) => {
		await sendMessage("scrollToPosition", { name: positionName });
	});

	// ===========================================================================
	// CUSTOM SELECTORS
	// ===========================================================================
	onCommand("confirmSelectorsCustomization", async () => {
		await sendMessageToAllFrames("customHintsConfirm");
	});

	onCommand("displayExcludedHints", async () => {
		await sendMessageToAllFrames("displayMoreOrLessHints", { excluded: true });
	});

	onCommand("displayExtraHints", async () => {
		await sendMessageToAllFrames("displayMoreOrLessHints", { extra: true });
	});

	onCommand("displayLessHints", async () => {
		await sendMessageToAllFrames("displayMoreOrLessHints", {
			extra: false,
			excluded: false,
		});
	});

	onCommand("excludeAllHints", async () => {
		await sendMessageToAllFrames("markAllHintsForExclusion");
	});

	onCommand("excludeExtraSelectors", async ({ target }) => {
		await sendMessageToTargetFrames("markHintsForExclusion", { target });
	});

	onCommand("includeExtraSelectors", async ({ target }) => {
		await sendMessageToTargetFrames("markHintsForInclusion", { target });
	});

	onCommand("includeOrExcludeLessSelectors", async () => {
		await sendMessageToAllFrames("markHintsWithNarrowerSelector");
	});

	onCommand("includeOrExcludeMoreSelectors", async () => {
		await sendMessageToAllFrames("markHintsWithBroaderSelector");
	});

	onCommand("resetCustomSelectors", async () => {
		await sendMessageToAllFrames("customHintsReset");
	});

	// ===========================================================================
	// TOGGLE HINTS
	// ===========================================================================
	onCommand("disableHints", async ({ level }) => {
		await updateHintsToggle(level, false);
		await notifyTogglesStatus();
	});

	onCommand("displayTogglesStatus", async () => {
		await notifyTogglesStatus();
	});

	onCommand("enableHints", async ({ level }) => {
		await updateHintsToggle(level, true);
		await notifyTogglesStatus();
	});

	onCommand("toggleHints", async () => {
		await toggleHintsGlobal();
		await notifyTogglesStatus();
	});

	onCommand("resetToggleLevel", async ({ level }) => {
		await updateHintsToggle(level);
		await notifyTogglesStatus();
	});

	// ===========================================================================
	// HINTS
	// ===========================================================================
	onCommand("hideHint", async ({ target }) => {
		await sendMessageToTargetFrames("hideHint", { target });
	});

	onCommand("refreshHints", refreshHints);

	// ===========================================================================
	// SETTINGS
	// ===========================================================================
	onCommand("decreaseHintSize", async () => {
		const hintFontSize = await retrieve("hintFontSize");
		await store("hintFontSize", hintFontSize - 1);
	});

	onCommand("increaseHintSize", async () => {
		const hintFontSize = await retrieve("hintFontSize");
		await store("hintFontSize", hintFontSize + 1);
	});

	onCommand("openSettingsPage", async () => {
		await browser.runtime.openOptionsPage();
	});

	// ===========================================================================
	// HELPERS
	// ===========================================================================
	// This command was removed at some point. Remove this after April 2025. Note
	// that only the command and not the message has to be removed. The latter is
	// still in use.
	onCommand("checkActiveElementIsEditable", async () => {
		const message = `Command "checkActiveElementIsEditable" has been removed. Update rango-talon.`;
		await notify.error(message);

		return { name: "printError", message };
	});

	onCommand("requestTimedOut", async () => {
		discardNextResponse();
		return "noResponse";
	});

	// ===========================================================================
	// REFERENCES
	// ===========================================================================
	onCommand("saveReference", async ({ target, referenceName }) => {
		assertPrimitiveTarget(target);
		await sendMessageToTargetFrames("saveReference", {
			target,
			referenceName,
		});
	});

	onCommand("removeReference", async ({ referenceName }) => {
		await assertReferenceInCurrentTab(referenceName);
		const allFrames = await getAllFrames();
		const hostPatterns = allFrames.map((frame) => getHostPattern(frame.url));

		await withLockedStorageAccess("references", async (references) => {
			for (const hostPattern of hostPatterns) {
				references.get(hostPattern)?.delete(referenceName);
			}
		});

		await notify.success(`Removed reference "${referenceName}"`);
	});

	onCommand("showReferences", async () => {
		await sendMessageToAllFrames("showReferences");
	});

	onCommand("saveReferenceForActiveElement", async ({ referenceName }) => {
		const { resultsWithFrameId } = await sendMessageToAllFrames(
			"hasActiveEditableElement"
		);

		const frameId = resultsWithFrameId.find(({ result }) => result)?.frameId;
		if (frameId === undefined) {
			throw new Error("No active editable element found");
		}

		await sendMessage(
			"saveReferenceForActiveElement",
			{ referenceName },
			{ frameId }
		);
	});
}
