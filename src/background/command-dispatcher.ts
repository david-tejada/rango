import { ResponseToTalon, RangoAction } from "../typing/types";
import { sendRequestToActiveTab } from "./tabs-messaging";
import { executeBackgroundCommand } from "./background-commands";

const backgroundCommands = new Set(["toggleHints"]);

export async function dispatchCommand(
	command: RangoAction
): Promise<ResponseToTalon> {
	if (backgroundCommands.has(command.type)) {
		await executeBackgroundCommand(command);
		return {
			type: "response",
			action: {
				type: "ok",
			},
		};
	}

	const commandResult = await sendRequestToActiveTab(command);

	if (
		commandResult &&
		"talonAction" in commandResult &&
		commandResult.talonAction
	) {
		return {
			type: "response",
			action: commandResult.talonAction,
		};
	}

	return {
		type: "response",
		action: {
			type: "ok",
		},
	};
}
