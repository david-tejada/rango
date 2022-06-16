import { RangoAction, TalonAction } from "../typing/types";
import { getStored, setStored } from "../lib/storage";
import { sendRequestToAllTabs, getActiveTab } from "./tabs-messaging";
import { notify } from "./notify";

export async function executeBackgroundCommand(
	command: RangoAction
): Promise<TalonAction> {
	switch (command.type) {
		case "toggleHints": {
			const showHints = await getStored("showHints");
			await setStored({ showHints: !showHints });
			await sendRequestToAllTabs({ type: "fullHintsUpdate" });
			break;
		}

		case "enableHints":
			if (command.modifier === "global") {
				await setStored({ showHints: true });
				await sendRequestToAllTabs({ type: "fullHintsUpdate" });
			}

			break;

		case "disableHints":
			if (command.modifier === "global") {
				await setStored({ showHints: false });
				await sendRequestToAllTabs({ type: "fullHintsUpdate" });
			}

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
			await setStored({ hintStyle: command.target });
			await sendRequestToAllTabs({ type: "fullHintsUpdate" });
			break;

		case "setHintWeight":
			await setStored({ hintWeight: command.target });
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
