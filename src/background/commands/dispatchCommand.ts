import { ResponseToTalon, TalonAction } from "../../typings/RequestFromTalon";
import { RangoAction } from "../../typings/RangoAction";
import { sendRequestToContent } from "../messaging/sendRequestToContent";
import { constructTalonResponse } from "../utils/constructTalonResponse";
import { promiseWrap } from "../../lib/promiseWrap";
import { runBackgroundCommand } from "./runBackgroundCommand";

const backgroundCommands = new Set<RangoAction["type"]>([
	"toggleHints",
	"enableHints",
	"disableHints",
	"resetToggleLevel",
	"increaseHintSize",
	"decreaseHintSize",
	"setHintStyle",
	"setHintWeight",
	"copyLocationProperty",
	"copyCurrentTabMarkdownUrl",
	"getBareTitle",
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
	"openSettingsPage",
	"openPageInNewTab",
	"activateTab",
	"closeTab",
	"refreshTabMarkers",
	"toggleTabMarkers",
	"focusOrCreateTabByUrl",
	"focusTabByText",
	"cycleTabsByText",
	"focusTabLastSounded",
]);

export async function dispatchCommand(
	command: RangoAction
): Promise<ResponseToTalon> {
	const result = (await (backgroundCommands.has(command.type)
		? runBackgroundCommand(command)
		: sendRequestToContent(command))) as string | TalonAction[] | undefined;

	if (typeof result === "string") {
		return constructTalonResponse([
			{
				name: "copyToClipboard",
				textToCopy: result,
			},
		]);
	}

	// In Firefox, when we perform window.focus() in the content script, the page
	// doesn't receive focus immediately. It seems like the page doesn't focus
	// until the content script finishes handling the current message callback.
	// Here we check again and remove the "focusPage" action if necessary.
	if (result) {
		const focusActionIndex = result.findIndex(
			(action) => action.name === "focusPage"
		);

		if (focusActionIndex !== -1) {
			const [documentHasFocus] = await promiseWrap(
				sendRequestToContent({
					type: "checkIfDocumentHasFocus",
				}) as Promise<boolean>
			);

			if (documentHasFocus) {
				result.splice(focusActionIndex, 1);
			}
		}
	}

	return constructTalonResponse(result ?? []);
}
