import {
	ResponseToTalon,
	ResponseWithTalonAction,
	RangoAction,
	TalonAction,
} from "../typing/types";
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
		const response = (await sendRequestToActiveTab(command)) as
			| ResponseWithTalonAction
			| undefined;
		if (response?.talonAction) {
			talonAction = response.talonAction;
		}
	} catch (error: unknown) {
		// This handles when the user says one or two letters in a page where Rango can't run,
		// for example, a New tab page
		if (command.type === "directClickElement" && error instanceof Error) {
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
