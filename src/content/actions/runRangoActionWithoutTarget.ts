import { toast } from "react-toastify";
import { RangoActionWithoutTarget } from "../../typings/RangoAction";
import { notifyTogglesStatus } from "../notify/notify";

import { focusesOnclick } from "../utils/focusesOnclick";
import { unhoverAll } from "./hoverElement";
import { scroll } from "./scroll";
import { navigateToNextPage, navigateToPreviousPage } from "./pagination";
import { blur, focusFirstInput } from "./focus";
import {
	customHintsConfirm,
	displayMoreOrLessHints,
	markHintsWithNarrowerSelector,
	markHintsWithBroaderSelector,
	customHintsReset,
} from "./customHints";
import { refreshHints } from "./refreshHints";
import { rangoActionOnSavedID, styleSavedHints } from "./actOnUniqueIDs";

export async function runRangoActionWithoutTarget(
	request: RangoActionWithoutTarget
): Promise<string | boolean | undefined> {
	console.log(request);
	switch (request.type) {
		case "historyGoBack":
			window.history.back();
			break;

		case "historyGoForward":
			window.history.forward();
			break;

		case "navigateToPageRoot":
			window.location.href = "/";
			break;

		case "navigateToNextPage":
			navigateToNextPage();
			break;

		case "navigateToPreviousPage":
			navigateToPreviousPage();
			break;

		case "displayTogglesStatus":
			await notifyTogglesStatus();
			break;

		case "focusFirstInput":
			await focusFirstInput();
			break;

		case "scrollUpPage":
			scroll({ dir: "up", target: "page", factor: request.arg });
			break;

		case "scrollDownPage":
			scroll({ dir: "down", target: "page", factor: request.arg });
			break;

		case "scrollUpLeftAside":
			scroll({ dir: "up", target: "leftAside", factor: request.arg });
			break;

		case "scrollDownLeftAside":
			scroll({ dir: "down", target: "leftAside", factor: request.arg });
			break;

		case "scrollUpRightAside":
			scroll({ dir: "up", target: "rightAside", factor: request.arg });
			break;

		case "scrollDownRightAside":
			scroll({ dir: "down", target: "rightAside", factor: request.arg });
			break;

		case "scrollLeftPage":
			scroll({ dir: "left", target: "page", factor: request.arg });
			break;

		case "scrollRightPage":
			scroll({ dir: "right", target: "page", factor: request.arg });
			break;

		case "scrollUpAtElement":
			scroll({ dir: "up", target: "repeatLast" });
			break;

		case "scrollDownAtElement":
			scroll({ dir: "down", target: "repeatLast" });
			break;

		case "scrollRightAtElement":
			scroll({ dir: "right", target: "repeatLast" });
			break;

		case "scrollLeftAtElement":
			scroll({ dir: "left", target: "repeatLast" });
			break;

		case "displayExtraHints":
			await displayMoreOrLessHints({ extra: true });
			break;

		case "displayExcludedHints":
			await displayMoreOrLessHints({ excluded: true });
			break;

		case "displayLessHints":
			await displayMoreOrLessHints({ extra: false, excluded: false });
			break;

		case "confirmSelectorsCustomization":
			await customHintsConfirm();
			break;

		case "resetCustomSelectors": {
			await customHintsReset();
			break;
		}

		case "includeOrExcludeMoreSelectors":
			await markHintsWithBroaderSelector();
			break;

		case "includeOrExcludeLessSelectors":
			await markHintsWithNarrowerSelector();
			break;

		case "refreshHints":
			await refreshHints();
			break;

		case "unhoverAll":
			blur();
			unhoverAll();
			toast.dismiss();
			break;

		case "checkActiveElementIsEditable":
			return Boolean(
				document.hasFocus() &&
					document.activeElement &&
					focusesOnclick(document.activeElement)
			);

		case "rangoActionOnSavedID":
			const actionAndTargetName = request.arg as string;
			console.log(actionAndTargetName);
			await rangoActionOnSavedID(actionAndTargetName);
			break;

		case "showSavedIDs":
			await styleSavedHints();
			break;

		default:
			console.log("Unknown action type");
			console.log(request.type);
			console.log(request);
			break;
	}

	return undefined;
}
