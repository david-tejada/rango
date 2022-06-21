import browser from "webextension-polyfill";
import { RangoAction, HintsToggle, TalonAction } from "../typing/types";
import { getStored, setStored } from "../lib/storage";
import { sendRequestToAllTabs, getActiveTab } from "./tabs-messaging";
import { notify } from "./notify";
import { toggleHints } from "./toggle-hints";
import { closeTabsInWindow } from "./close-tabs";

export async function executeBackgroundCommand(
	command: RangoAction
): Promise<TalonAction> {
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

		case "getCurrentTabUrl": {
			const activeTab = await getActiveTab();
			if (activeTab?.url) {
				return {
					type: "textRetrieved",
					text: activeTab.url.toString(),
				};
			}

			return {
				type: "noAction",
			};
		}

		case "copyCurrentTabMarkdownUrl": {
			const activeTab = await getActiveTab();
			if (activeTab?.url && activeTab?.title) {
				return {
					type: "copyToClipboard",
					textToCopy: `[${activeTab.title}](${activeTab.url.toString()})`,
				};
			}

			return {
				type: "noAction",
			};
		}

		default:
			break;
	}

	return {
		type: "noAction",
	};
}

browser.tabs.onMoved.addListener((tabId, moveInfo) => {
	console.log({ tabId, moveInfo });
});
