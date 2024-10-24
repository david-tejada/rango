import browser from "webextension-polyfill";
import { type TalonAction } from "../../typings/RequestFromTalon";
import { activateTab } from "../actions/activateTab";
import { closeTab } from "../actions/closeTab";
import { toggleHintsGlobal, updateHintsToggle } from "../actions/toggleHints";
import { onCommand } from "../commands/commandEvents";
import { sendMessagesToTargetFrames } from "../messaging/backgroundMessageBroker";
import { notify } from "../utils/notify";
import { discardNextResponse } from "../utils/requestAndResponse";

export function setupCommandListeners() {
	// ===========================================================================
	// NAVIGATION
	// ===========================================================================
	onCommand("historyGoBack", async () => {
		// todo
	});

	onCommand("historyGoForward", async () => {
		// todo
	});

	onCommand("navigateToNextPage", async () => {
		// todo
	});

	onCommand("navigateToPageRoot", async () => {
		// todo
	});

	onCommand("navigateToPreviousPage", async () => {
		// todo
	});

	// ===========================================================================
	// TABS
	// ===========================================================================
	onCommand("activateTab", async ({ target }) => {
		await activateTab(target);
	});
	onCommand("cloneCurrentTab", async () => {
		// todo
	});
	onCommand("closeNextTabsInWindow", async () => {
		// todo
	});
	onCommand("closeOtherTabsInWindow", async () => {
		// todo
	});
	onCommand("closePreviousTabsInWindow", async () => {
		// todo
	});
	onCommand("closeTab", async ({ target }) => {
		await closeTab(target);
	});
	onCommand("closeTabsLeftEndInWindow", async () => {
		// todo
	});
	onCommand("closeTabsRightEndInWindow", async () => {
		// todo
	});
	onCommand("closeTabsToTheLeftInWindow", async () => {
		// todo
	});
	onCommand("closeTabsToTheRightInWindow", async () => {
		// todo
	});
	onCommand("copyCurrentTabMarkdownUrl", async () => {
		// todo
	});
	onCommand("copyLocationProperty", async ({ arg }) => {
		// todo
	});
	onCommand("cycleTabsByText", async () => {
		// todo
	});
	onCommand("focusNextAudibleTab", async () => {
		// todo
	});
	onCommand("focusNextMutedTab", async () => {
		// todo
	});
	onCommand("focusNextTabWithSound", async () => {
		// todo
	});
	onCommand("focusOrCreateTabByUrl", async () => {
		// todo
	});
	onCommand("focusPreviousTab", async () => {
		// todo
	});
	onCommand("focusTabByText", async () => {
		// todo
	});
	onCommand("focusTabLastSounded", async () => {
		// todo
	});
	onCommand("getBareTitle", async () => {
		// todo
	});
	onCommand("moveCurrentTabToNewWindow", async () => {
		// todo
	});
	onCommand("muteAllTabsWithSound", async () => {
		// todo
	});
	onCommand("muteCurrentTab", async () => {
		// todo
	});
	onCommand("muteNextTabWithSound", async () => {
		// todo
	});
	onCommand("muteTab", async () => {
		// todo
	});
	onCommand("openPageInNewTab", async () => {
		// todo
	});
	onCommand("refreshTabMarkers", async () => {
		// todo
	});
	onCommand("toggleTabMarkers", async () => {
		// todo
	});
	onCommand("unmuteAllMutedTabs", async () => {
		// todo
	});
	onCommand("unmuteCurrentTab", async () => {
		// todo
	});
	onCommand("unmuteNextMutedTab", async () => {
		// todo
	});
	onCommand("unmuteTab", async () => {
		// todo
	});

	// ===========================================================================
	// KEYBOARD CLICKING
	// ===========================================================================
	onCommand("toggleKeyboardClicking", async () => {
		// todo
	});

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
			"copyElementTextContent",
			{ target }
		);
		if (values.length === 0) return;

		return [
			{
				name: "copyToClipboard",
				textToCopy: values.flat().join("\n"),
			},
		];
	});

	onCommand("copyLink", async ({ target }) => {
		// todo
	});
	onCommand("copyMarkdownLink", async ({ target }) => {
		// todo
	});

	onCommand("directClickElement", async ({ target }) => {
		const { values } = await sendMessagesToTargetFrames("directClickElement", {
			target,
		});

		if (target.length === 1 && values[0]?.noHintFound) {
			return [{ name: "typeTargetCharacters" }];
		}

		return handleClickResults(values);
	});

	onCommand("focusAndDeleteContents", async ({ target }) => {
		// todo
	});

	onCommand("focusElement", async ({ target }) => {
		if (target.length > 1) {
			await notify("Only one element can be focused.", { type: "warning" });
		}

		const filteredTarget = target[0] ? [target[0]] : [];

		const { values } = await sendMessagesToTargetFrames("focusElement", {
			target: filteredTarget,
		});

		return values[0]?.focusPage ? [{ name: "focusPage" }] : undefined;
	});

	onCommand("focusFirstInput", async () => {
		// todo
	});
	onCommand("hoverElement", async ({ target }) => {
		// todo
	});
	onCommand("insertToField", async ({ target, arg }) => {
		// todo
	});
	onCommand("openInBackgroundTab", async ({ target }) => {
		// todo
	});

	onCommand("openInNewTab", async ({ target }) => {
		const { values } = await sendMessagesToTargetFrames("getAnchorHrefs", {
			target,
		});

		await Promise.all(
			values
				.flat()
				.map(async (href) => browser.tabs.create({ url: href, active: false }))
		);
	});

	onCommand("setSelectionAfter", async ({ target }) => {
		// todo
	});
	onCommand("setSelectionBefore", async ({ target }) => {
		// todo
	});
	onCommand("showLink", async ({ target }) => {
		await sendMessagesToTargetFrames("showLink", { target });
	});
	onCommand("tryToFocusElementAndCheckIsEditable", async ({ target }) => {
		const { values } = await sendMessagesToTargetFrames(
			"tryToFocusElementAndCheckIsEditable",
			{ target }
		);

		return [{ name: "responseValue", value: values[0]! }];
	});
	onCommand("unhoverAll", async () => {
		// todo
	});

	// ===========================================================================
	// SCROLL
	// ===========================================================================
	onCommand("scrollDownAtElement", async () => {
		// todo
	});
	onCommand("scrollDownLeftAside", async ({ arg }) => {
		// todo
	});
	onCommand("scrollDownPage", async ({ arg }) => {
		// todo
	});
	onCommand("scrollDownRightAside", async ({ arg }) => {
		// todo
	});
	onCommand("scrollElementToBottom", async ({ target }) => {
		// todo
	});
	onCommand("scrollElementToCenter", async ({ target }) => {
		// todo
	});
	onCommand("scrollElementToTop", async ({ target }) => {
		// todo
	});
	onCommand("scrollLeftAtElement", async () => {
		// todo
	});
	onCommand("scrollLeftPage", async ({ arg }) => {
		// todo
	});
	onCommand("scrollRightAtElement", async () => {
		// todo
	});
	onCommand("scrollRightPage", async ({ arg }) => {
		// todo
	});
	onCommand("scrollToPosition", async ({ arg }) => {
		// todo
	});
	onCommand("scrollUpAtElement", async () => {
		// todo
	});
	onCommand("scrollUpLeftAside", async ({ arg }) => {
		// todo
	});
	onCommand("scrollUpPage", async ({ arg }) => {
		// todo
	});
	onCommand("scrollUpRightAside", async ({ arg }) => {
		// todo
	});
	onCommand("storeScrollPosition", async ({ arg }) => {
		// todo
	});

	// ===========================================================================
	// CUSTOM SELECTORS
	// ===========================================================================
	onCommand("confirmSelectorsCustomization", async () => {
		// todo
	});
	onCommand("displayExcludedHints", async () => {
		// todo
	});
	onCommand("displayExtraHints", async () => {
		// todo
	});
	onCommand("displayLessHints", async () => {
		// todo
	});
	onCommand("excludeAllHints", async () => {
		// todo
	});
	onCommand("excludeExtraSelectors", async ({ target }) => {
		// todo
	});
	onCommand("includeExtraSelectors", async ({ target }) => {
		// todo
	});
	onCommand("includeOrExcludeLessSelectors", async () => {
		// todo
	});
	onCommand("includeOrExcludeMoreSelectors", async () => {
		// todo
	});
	onCommand("resetCustomSelectors", async () => {
		// todo
	});

	// ===========================================================================
	// TOGGLE HINTS
	// ===========================================================================
	onCommand("disableHints", async ({ arg }) => {
		await updateHintsToggle(arg, false);
	});
	onCommand("displayTogglesStatus", async () => {
		// todo
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
		// todo
	});
	onCommand("refreshHints", async () => {
		// todo
	});

	// ===========================================================================
	// SETTINGS
	// ===========================================================================
	onCommand("decreaseHintSize", async () => {
		// todo
	});
	onCommand("increaseHintSize", async () => {
		// todo
	});
	onCommand("openSettingsPage", async () => {
		// todo
	});

	// ===========================================================================
	// HELPERS
	// ===========================================================================
	onCommand("checkActiveElementIsEditable", async () => {
		// todo
	});
	onCommand("requestTimedOut", async () => {
		discardNextResponse();
		return "noResponse";
	});

	// ===========================================================================
	// REFERENCES
	// ===========================================================================
	onCommand("removeReference", async ({ arg }) => {
		// todo
	});
	onCommand("runActionOnReference", async ({ arg, arg2 }) => {
		// todo
	});
	onCommand("saveReference", async ({ target, arg }) => {
		// todo
	});
	onCommand("saveReferenceForActiveElement", async ({ arg }) => {
		// todo
	});
	onCommand("showReferences", async ({}) => {
		// todo
	});

	// ===========================================================================
	// FUZZY SEARCH ELEMENTS
	// ===========================================================================
	onCommand("executeActionOnTextMatchedElement", async ({ actionType }) => {
		// todo
	});
	onCommand("matchElementByText", async ({ text, prioritizeViewport }) => {
		// todo
	});
	onCommand("runActionOnTextMatchedElement", async ({ arg, arg2, arg3 }) => {
		// todo
	});
}
