import { ResponseToTalon, RangoAction } from "../typing/types";
import { sendRequestToActiveTab } from "./tabs-messaging";
import { executeBackgroundCommand } from "./background-commands";

const backgroundCommands = new Set([
	"toggleHints",
	"increaseHintSize",
	"decreaseHintSize",
	"setHintStyle",
	"setHintWeight",
]);

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

	const { talonAction } = await sendRequestToActiveTab(command);

	if (talonAction) {
		return {
			type: "response",
			action: talonAction,
		};
	}

	return {
		type: "response",
		action: {
			type: "ok",
		},
	};
}
