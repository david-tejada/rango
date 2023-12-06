import { toast } from "react-toastify";
import { RangoActionWithoutTarget } from "../../typings/RangoAction";
import { notify, notifyTogglesStatus } from "../notify/notify";
import { isEditable } from "../utils/domUtils";
import {
	customHintsConfirm,
	customHintsReset,
	displayMoreOrLessHints,
	markAllHintsForExclusion,
	markHintsWithBroaderSelector,
	markHintsWithNarrowerSelector,
} from "./customHints";
import { scrollToPosition, storeScrollPosition } from "./customScrollPositions";
import { blur, focusFirstInput } from "./focus";
import { unhoverAll } from "./hoverElement";
import { navigateToNextPage, navigateToPreviousPage } from "./pagination";
import { removeReference, showReferences } from "./references";
import { refreshHints } from "./refreshHints";
import { runActionOnReference } from "./runActionOnReference";
import { scroll } from "./scroll";

export async function runRangoActionWithoutTarget(
	request: RangoActionWithoutTarget
): Promise<string | boolean | undefined> {
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

		case "storeScrollPosition":
			await storeScrollPosition(request.arg);
			break;

		case "scrollToPosition":
			await scrollToPosition(request.arg);
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

		case "excludeAllHints":
			await markAllHintsForExclusion();
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
					isEditable(document.activeElement)
			);

		case "runActionOnReference":
			return runActionOnReference(request.arg, request.arg2);

		case "showReferences":
			await showReferences();
			break;

		case "removeReference":
			return removeReference(request.arg);

		default:
			await notify(`Invalid action "${request.type}"`, {
				type: "error",
			});
			break;
	}

	return undefined;
}
