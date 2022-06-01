import { RangoAction } from "../typing/types";
import { sendRequestToAllTabs } from "./tabs-messaging";

export async function executeBackgroundCommand(command: RangoAction) {
	switch (command.type) {
		case "toggleHints":
			await sendRequestToAllTabs({ type: "toggleHints" });
			break;
		default:
			break;
	}
}
