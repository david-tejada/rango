import { toast } from "react-toastify";
import { RangoActionWithoutTarget } from "../../typings/RangoAction";
import {
	displayMoreOrLessHints,
	refreshHints,
	updateHintablesBySelector,
} from "../wrappers/updateWrappers";
import { updateCustomSelectors } from "../hints/selectors";
import {
	confirmSelectorsCustomization,
	resetCustomSelectors,
} from "../hints/customHintsEdit";
import { notifyTogglesStatus } from "../notify/notify";
import { includeOrExcludeMoreOrLessSelectors } from "./customHints";
import { unhoverAll } from "./hoverElement";
import { scroll } from "./scroll";
import { navigateToNextPage, navigateToPreviousPage } from "./pagination";
import { blur, focusFirstInput } from "./focus";

export async function runRangoActionWithoutTarget(
	request: RangoActionWithoutTarget
): Promise<string | undefined> {
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
			displayMoreOrLessHints({ extra: true });
			break;

		case "displayExcludedHints":
			displayMoreOrLessHints({ excluded: true });
			break;

		case "displayLessHints":
			displayMoreOrLessHints({ extra: false, excluded: false });
			break;

		case "confirmSelectorsCustomization": {
			const selectorsAdded = await confirmSelectorsCustomization();
			await updateCustomSelectors();
			updateHintablesBySelector(selectorsAdded.join(", "));
			displayMoreOrLessHints({ extra: false, excluded: false });
			break;
		}

		case "resetCustomSelectors": {
			const customSelectorsRemoved = await resetCustomSelectors();

			if (customSelectorsRemoved) {
				await updateCustomSelectors();
				updateHintablesBySelector(customSelectorsRemoved.join(", "));
				await refreshHints();
			}

			break;
		}

		case "unhoverAll":
			blur();
			unhoverAll();
			toast.dismiss();
			break;

		case "refreshHints":
			await refreshHints();
			break;

		case "includeOrExcludeMoreSelectors":
			includeOrExcludeMoreOrLessSelectors(true);
			break;

		case "includeOrExcludeLessSelectors":
			includeOrExcludeMoreOrLessSelectors(false);
			break;

		default:
			break;
	}

	return undefined;
}
