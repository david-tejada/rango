import { ResponseToTalon, TalonAction } from "../../typings/RequestFromTalon";
import { RangoAction } from "../../typings/RangoAction";
import { sendRequestToCurrentTab } from "../messaging/sendRequestToCurrentTab";
import { constructTalonResponse } from "../utils/constructTalonResponse";
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
	"historyGoBack",
	"historyGoForward",
]);

export async function dispatchCommand(
	command: RangoAction
): Promise<ResponseToTalon> {
	const result = (await (backgroundCommands.has(command.type)
		? runBackgroundCommand(command)
		: sendRequestToCurrentTab(command))) as string | TalonAction[] | undefined;

	if (typeof result === "string") {
		return constructTalonResponse([
			{
				name: "copyToClipboard",
				textToCopy: result,
			},
		]);
	}

	if (result?.type) return { type: "response", action: result };

	return constructTalonResponse(result ?? []);
}
