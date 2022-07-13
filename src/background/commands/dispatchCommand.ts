import { ResponseWithTalonAction } from "../../typings/ScriptResponse";
import { ResponseToTalon, TalonAction } from "../../typings/RequestFromTalon";
import { RangoAction } from "../../typings/RangoAction";
import { sendRequestToCurrentTab } from "../messaging/sendRequestToCurrentTab";
import { noActionResponse } from "../utils/responseObjects";
import { runBackgroundCommand } from "./runBackgroundCommand";

const backgroundCommands = new Set([
	"toggleHints",
	"enableHints",
	"disableHints",
	"resetToggleLevel",
	"increaseHintSize",
	"decreaseHintSize",
	"setHintStyle",
	"setHintWeight",
	"copyCurrentTabMarkdownUrl",
	"enableUrlInTitle",
	"disableUrlInTitle",
	"excludeSingleLetterHints",
	"includeSingleLetterHints",
	"closeOtherTabsInWindow",
	"closeTabsToTheLeftInWindow",
	"closeTabsToTheRightInWindow",
	"closeTabsLeftEndInWindow",
	"closeTabsRightEndInWindow",
	"closePreviousTabsInWindow",
	"closeNextTabsInWindow",
	"cloneCurrentTab",
	"toggleKeyboardClicking",
	"moveCurrentTabToNewWindow",
]);

export async function dispatchCommand(
	command: RangoAction
): Promise<ResponseToTalon> {
	let talonAction: TalonAction | undefined;

	if (backgroundCommands.has(command.type)) {
		talonAction = await runBackgroundCommand(command);
	} else {
		const response = (await sendRequestToCurrentTab(command)) as
			| ResponseWithTalonAction
			| undefined;
		if (response?.talonAction) {
			talonAction = response.talonAction;
		}

		if (talonAction) {
			return {
				type: "response",
				action: talonAction,
			};
		}
	}

	return noActionResponse;
}
