import { RangoAction, TalonAction } from "../typing/types";
import { getStored, setStored } from "../lib/storage";
import { sendRequestToAllTabs, getActiveTab } from "./tabs-messaging";

export async function executeBackgroundCommand(
	command: RangoAction
): Promise<TalonAction> {
	switch (command.type) {
		case "toggleHints": {
			const showHints = await getStored("showHints");
			await setStored({ showHints: !showHints });
			break;
		}

		case "increaseHintSize": {
			const hintFontSize = (await getStored("hintFontSize")) as number;
			await setStored({ hintFontSize: hintFontSize + 1 });
			break;
		}

		case "decreaseHintSize": {
			const hintFontSize = (await getStored("hintFontSize")) as number;
			await setStored({ hintFontSize: hintFontSize - 1 });
			break;
		}

		case "setHintStyle":
			await setStored({ hintStyle: command.target });
			break;

		case "setHintWeight":
			await setStored({ hintWeight: command.target });
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

	await sendRequestToAllTabs({ type: "fullHintsUpdate" });
	return {
		type: "noAction",
	};
}
