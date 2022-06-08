import { RangoAction } from "../typing/types";
import { getStored, setStored } from "../lib/storage";
import { sendRequestToAllTabs } from "./tabs-messaging";

export async function executeBackgroundCommand(command: RangoAction) {
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

		default:
			break;
	}

	await sendRequestToAllTabs({ type: "fullHintsUpdate" });
}
