import {
	ResponseToTalon,
	ResponseWithTalonAction,
	RangoAction,
	TalonAction,
} from "../typing/types";
import { sendRequestToCurrentTab } from "./tabs-messaging";
import { executeBackgroundCommand } from "./background-commands";
import { noActionResponse } from "./response-utils";

const backgroundCommands = new Set([
	"toggleHints",
	"enableHints",
	"disableHints",
	"resetToggleLevel",
	"increaseHintSize",
	"decreaseHintSize",
	"setHintStyle",
	"setHintWeight",
	"getCurrentTabUrl",
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
		talonAction = await executeBackgroundCommand(command);
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
