import { ResponseToTalon, RangoAction, TalonAction } from "../typing/types";
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

	let talonAction: TalonAction | undefined;
	try {
		const response = await sendRequestToActiveTab(command);
		talonAction = response.talonAction;
	} catch (error: unknown) {
		if (error instanceof Error) {
			talonAction = {
				type: "noHintFound",
			};
		}
	}

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
