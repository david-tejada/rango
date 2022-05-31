import { Command } from "../typing/types";
import { sendCommandToAllTabs } from "./tabs-messaging";

export async function executeBackgroundCommand(command: Command) {
	switch (command.type) {
		case "toggleHints":
			await sendCommandToAllTabs({ type: "toggleHints" });
			break;
		default:
			break;
	}
}
