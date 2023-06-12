import browser from "webextension-polyfill";
import { RangoAction } from "../../typings/RangoAction";
import { getCurrentTab } from "../utils/getCurrentTab";
import { notifySettingRemoved } from "../utils/notify";
import { toggleHintsGlobal, updateHintsToggle } from "../actions/toggleHints";
import { closeTabsInWindow } from "../actions/closeTabsInWindow";
import { toggleKeyboardClicking } from "../actions/toggleKeyboardClicking";
import { focusPreviousTab } from "../actions/focusPreviousTab";
import { sendRequestToContent } from "../messaging/sendRequestToContent";
import { retrieve, store } from "../../common/storage";
import { activateTab } from "../actions/activateTab";
import { copyLocationProperty, copyMarkdownUrl } from "../actions/copyTabInfo";
import { promiseWrap } from "../../lib/promiseWrap";

export async function runBackgroundCommand(
	command: RangoAction
): Promise<string | undefined> {
	const [currentTab] = await promiseWrap(getCurrentTab());
	const currentTabId = currentTab?.id;

	switch (command.type) {
		case "activateTab": {
			await activateTab(command.target);
			break;
		}

		case "historyGoBack":
			try {
				await sendRequestToContent(command);
			} catch {
				await browser.tabs.goBack();
			}

			break;

		case "historyGoForward":
			try {
				await sendRequestToContent(command);
			} catch {
				await browser.tabs.goForward();
			}

			break;

		case "toggleHints":
			await toggleHintsGlobal();
			break;

		case "enableHints": {
			await updateHintsToggle(command.arg, true);
			break;
		}

		case "disableHints":
			await updateHintsToggle(command.arg, false);
			break;

		case "resetToggleLevel":
			await updateHintsToggle(command.arg);
			break;

		case "toggleKeyboardClicking":
			await toggleKeyboardClicking();
			break;

		// To be removed in v0.5
		case "includeSingleLetterHints":
		case "excludeSingleLetterHints":
		case "setHintStyle":
		case "setHintWeight":
		case "enableUrlInTitle":
		case "disableUrlInTitle":
			await notifySettingRemoved();
			break;

		case "increaseHintSize": {
			const hintFontSize = await retrieve("hintFontSize");
			await store("hintFontSize", hintFontSize + 1);
			break;
		}

		case "decreaseHintSize": {
			const hintFontSize = await retrieve("hintFontSize");
			await store("hintFontSize", hintFontSize - 1);
			break;
		}

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
			if (currentTabId) {
				await browser.tabs.duplicate(currentTabId);
			}

			break;

		case "moveCurrentTabToNewWindow":
			await browser.windows.create({ tabId: currentTabId });
			break;

		case "focusPreviousTab":
			await focusPreviousTab();
			break;

		case "copyLocationProperty":
			if (currentTab) {
				return copyLocationProperty(currentTab, command.arg);
			}

			break;

		case "copyCurrentTabMarkdownUrl":
			if (currentTab) {
				return copyMarkdownUrl(currentTab);
			}

			break;

		case "openSettingsPage":
			await browser.runtime.openOptionsPage();
			break;

		case "openPageInNewTab":
			await browser.tabs.create({ url: command.arg });
			break;

		default:
			break;
	}

	return undefined;
}
