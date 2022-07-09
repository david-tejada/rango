import {
	ResponseToTalon,
	ResponseWithTalonAction,
	RangoAction,
	TalonAction,
} from "../typing/types";
import { sendRequestToActiveTab } from "./tabs-messaging";
import { executeBackgroundCommand } from "./background-commands";
import { noActionResponse } from "./response-utils";
import { assertDocumentFocused } from "./assert-document-focused";

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
		try {
			if (command.type === "directClickElement") {
				// If there is no document focused (for example, the user is in the address
				// bar or the devtools) this will throw an AggregateError that will be
				// handled by the catch below
				await assertDocumentFocused();
			}

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
	}

	if (talonAction) {
		return {
			type: "response",
			action: talonAction,
		};
	}

	return noActionResponse;
}
