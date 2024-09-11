import browser from "webextension-polyfill";
import { retrieve, store } from "../../common/storage";
import { promiseWrap } from "../../lib/promiseWrap";
import { RangoAction } from "../../typings/RangoAction";
import { TalonAction } from "../../typings/RequestFromTalon";
import { activateTab } from "../actions/activateTab";
import { closeTabsInWindow } from "../actions/closeTabsInWindow";
import {
	copyLocationProperty,
	copyMarkdownUrl,
	getBareTitle,
} from "../actions/copyTabInfo";
import { focusOrCreateTabByUrl } from "../actions/focusOrCreateTabByUrl";
import { focusPreviousTab } from "../actions/focusPreviousTab";
import { cycleTabsByText, focusTabByText } from "../actions/focusTabByText";
import { toggleHintsGlobal, updateHintsToggle } from "../actions/toggleHints";
import { toggleKeyboardClicking } from "../actions/toggleKeyboardClicking";
import { toggleTabMarkers } from "../actions/toggleTabMarkers";
import { sendRequestToContent } from "../messaging/sendRequestToContent";
import { refreshTabMarkers } from "../misc/tabMarkers";
import { getCurrentTab } from "../utils/getCurrentTab";
import { notifySettingRemoved } from "../utils/notify";
import { closeTab } from "../actions/closeTab";
import {
	focusNextAudibleTab,
	focusNextMutedTab,
	focusNextTabWithSound,
	focusTabLastSounded,
} from "../actions/focusTabBySound";

export async function runBackgroundCommand(
	command: RangoAction
): Promise<string | TalonAction[] | undefined> {
	const [currentTab] = await promiseWrap(getCurrentTab());
	const currentTabId = currentTab?.id;

	switch (command.type) {
		case "activateTab": {
			await activateTab(command.target);
			break;
		}

		case "closeTab": {
			await closeTab(command.target);
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

		case "toggleTabMarkers":
			await toggleTabMarkers();
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

		case "focusNextTabWithSound":
			await focusNextTabWithSound();
			break;

		case "focusNextMutedTab":
			await focusNextMutedTab();
			break;

		case "focusNextAudibleTab":
			await focusNextAudibleTab();
			break;

		case "focusTabLastSounded":
			await focusTabLastSounded();
			break;

		case "copyLocationProperty":
			if (currentTab) {
				return copyLocationProperty(currentTab, command.arg);
			}

			break;

		case "getBareTitle":
			if (currentTab) {
				const title = await getBareTitle(currentTab);
				return [{ name: "responseValue", value: title }];
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

		case "refreshTabMarkers":
			await refreshTabMarkers();
			break;

		case "focusOrCreateTabByUrl":
			return focusOrCreateTabByUrl(command.arg);

		case "focusTabByText":
			await focusTabByText(command.arg);
			break;

		case "cycleTabsByText":
			await cycleTabsByText(command.arg);
			break;

		default:
			break;
	}

	return undefined;
}
