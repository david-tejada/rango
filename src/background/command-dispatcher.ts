import { Message, Command } from "../typing/types";
import { sendCommandToActiveTab } from "./tabs-messaging";
import { executeBackgroundCommand } from "./background-commands";

const backgroundCommands = new Set(["toggleHints"]);

export async function dispatchCommand(command: Command): Promise<Message> {
	if (backgroundCommands.has(command.type)) {
		await executeBackgroundCommand(command);
		return {
			type: "response",
			action: {
				type: "ok",
			},
		};
	}

	return sendCommandToActiveTab(command);
}
