import { ResponseToTalon } from "../../typings/RequestFromTalon";
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
	"focusPreviousTab",
]);

export async function dispatchCommand(
	command: RangoAction
): Promise<ResponseToTalon> {
	const textToCopy = (await (backgroundCommands.has(command.type)
		? runBackgroundCommand(command)
		: sendRequestToCurrentTab(command))) as string | undefined;

	if (textToCopy) {
		return {
			type: "response",
			action: {
				type: "copyToClipboard",
				textToCopy,
			},
		};
	}

	return noActionResponse;
}
