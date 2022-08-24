import browser from "webextension-polyfill";
import { HintsToggle } from "../../typings/RangoOptions";
import { RangoAction } from "../../typings/RangoAction";
import { getStored, setStored } from "../../lib/getStored";
import { sendRequestToAllTabs } from "../messaging/sendRequestToAllTabs";
import { getCurrentTab, getCurrentTabId } from "../utils/getCurrentTab";
import { notify } from "../utils/notify";
import { toggleHints } from "../actions/toggleHints";
import { closeTabsInWindow } from "../actions/closeTabsInWindow";
import { toggleKeyboardClicking } from "../actions/toggleKeyboardClicking";
import { focusPreviousTab } from "../actions/focusPreviousTab";

export async function runBackgroundCommand(
	command: RangoAction
): Promise<string | undefined> {
	const currentTab = await getCurrentTab();
	const currentTabId = await getCurrentTabId();

	switch (command.type) {
		case "toggleHints": {
			const hintsToggle = (await getStored("hintsToggle")) as HintsToggle;
			hintsToggle.global = !hintsToggle.global;
			await setStored({ hintsToggle });
			await sendRequestToAllTabs({ type: "fullHintsUpdate" });
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
			await setStored({ includeSingleLetterHints: true });
			await sendRequestToAllTabs({ type: "fullHintsUpdate" });
			break;

		case "excludeSingleLetterHints":
			await setStored({ includeSingleLetterHints: false });
			await sendRequestToAllTabs({ type: "fullHintsUpdate" });
			break;

		case "increaseHintSize": {
			const hintFontSize = (await getStored("hintFontSize")) as number;
			await setStored({ hintFontSize: hintFontSize + 1 });
			await sendRequestToAllTabs({ type: "fullHintsUpdate" });
			break;
		}

		case "decreaseHintSize": {
			const hintFontSize = (await getStored("hintFontSize")) as number;
			await setStored({ hintFontSize: hintFontSize - 1 });
			await sendRequestToAllTabs({ type: "fullHintsUpdate" });
			break;
		}

		case "setHintStyle":
			await setStored({ hintStyle: command.arg });
			await sendRequestToAllTabs({ type: "fullHintsUpdate" });
			break;

		case "setHintWeight":
			await setStored({ hintWeight: command.arg });
			await sendRequestToAllTabs({ type: "fullHintsUpdate" });
			break;

		case "enableUrlInTitle":
			await setStored({ urlInTitle: true });
			notify("Url in title enabled", "Refresh the page to update the title");
			break;

		case "disableUrlInTitle":
			await setStored({ urlInTitle: false });
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
