import browser from "webextension-polyfill";
import { RangoAction } from "../../typings/RangoAction";
import { sendRequestToAllTabs } from "../messaging/sendRequestToAllTabs";
import { getCurrentTab, getCurrentTabId } from "../utils/getCurrentTab";
import { notify } from "../utils/notify";
import { toggleHints } from "../actions/toggleHints";
import { closeTabsInWindow } from "../actions/closeTabsInWindow";
import { toggleKeyboardClicking } from "../actions/toggleKeyboardClicking";
import { focusPreviousTab } from "../actions/focusPreviousTab";
import { sendRequestToCurrentTab } from "../messaging/sendRequestToCurrentTab";
import { retrieve, store } from "../../common/storage";

export async function runBackgroundCommand(
	command: RangoAction
): Promise<string | undefined> {
	const currentTab = await getCurrentTab();
	const currentTabId = await getCurrentTabId();

	switch (command.type) {
		case "historyGoBack":
			try {
				await sendRequestToCurrentTab(command);
			} catch {
				await browser.tabs.goBack();
			}

			break;

		case "historyGoForward":
			try {
				await sendRequestToCurrentTab(command);
			} catch {
				await browser.tabs.goForward();
			}

			break;

		case "toggleHints": {
			const hintsToggleGlobal = await retrieve("hintsToggleGlobal");
			await store("hintsToggleGlobal", !hintsToggleGlobal);
			await sendRequestToAllTabs({ type: "updateHintsEnabled" });
			break;
		}

		case "enableHints": {
			await toggleHints(command.arg, true);

			break;
		}

		case "disableHints":
			await toggleHints(command.arg, false);

			break;

		case "resetToggleLevel":
			await toggleHints(command.arg);

			break;

		case "toggleKeyboardClicking":
			await toggleKeyboardClicking();
			break;

		case "includeSingleLetterHints":
			await store("includeSingleLetterHints", true);
			await sendRequestToAllTabs({ type: "refreshHints" });
			break;

		case "excludeSingleLetterHints":
			await store("includeSingleLetterHints", false);
			await sendRequestToAllTabs({ type: "refreshHints" });
			break;

		case "increaseHintSize": {
			const hintFontSize = await retrieve("hintFontSize");
			await store("hintFontSize", hintFontSize + 1);
			await sendRequestToAllTabs({ type: "updateHintsStyle" });
			break;
		}

		case "decreaseHintSize": {
			const hintFontSize = await retrieve("hintFontSize");
			await store("hintFontSize", hintFontSize - 1);
			await sendRequestToAllTabs({ type: "updateHintsStyle" });
			break;
		}

		case "setHintStyle":
			await store("hintStyle", command.arg);
			await sendRequestToAllTabs({ type: "updateHintsStyle" });
			break;

		case "setHintWeight":
			await store("hintWeight", command.arg);
			await sendRequestToAllTabs({ type: "updateHintsStyle" });
			break;

		case "enableUrlInTitle":
			await store("urlInTitle", true);
			notify("Url in title enabled", "Refresh the page to update the title");
			break;

		case "disableUrlInTitle":
			await store("urlInTitle", false);
			notify("Url in title disabled", "Refresh the page to update the title");
			break;

		case "closeOtherTabsInWindow":
			await closeTabsInWindow("other");
			break;

		case "closeTabsToTheLeftInWindow":
			await closeTabsInWindow("left");
			break;

		case "closeTabsToTheRightInWindow":
			await closeTabsInWindow("right");
			break;

		case "closeTabsLeftEndInWindow":
			await closeTabsInWindow("leftEnd", command.arg);
			break;

		case "closeTabsRightEndInWindow":
			await closeTabsInWindow("rightEnd", command.arg);
			break;

		case "closePreviousTabsInWindow":
			await closeTabsInWindow("previous", command.arg);
			break;

		case "closeNextTabsInWindow":
			await closeTabsInWindow("next", command.arg);
			break;

		case "cloneCurrentTab":
			await browser.tabs.duplicate(currentTabId);

			break;

		case "moveCurrentTabToNewWindow":
			await browser.windows.create({ tabId: currentTabId });
			break;

		case "focusPreviousTab":
			await focusPreviousTab();
			break;

		case "copyCurrentTabMarkdownUrl":
			if (currentTab.url && currentTab.title) {
				return `[${currentTab.title.replace(` - ${currentTab.url}`, "")}](${
					currentTab.url
				})`;
			}

			break;

		default:
			break;
	}

	return undefined;
}
