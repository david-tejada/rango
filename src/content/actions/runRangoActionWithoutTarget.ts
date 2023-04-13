import { toast } from "react-toastify";
import { RangoActionWithoutTarget } from "../../typings/RangoAction";
import {
	displayMoreOrLessHints,
	updateHintablesBySelector,
} from "../wrappers/updateWrappers";
import { updateCustomSelectors } from "../hints/selectors";
import { resetCustomSelectors } from "../hints/customHintsEdit";
import { notify, notifyTogglesStatus } from "../notify/notify";
import {
	includeOrExcludeMoreOrLessSelectors,
	saveCustomSelectors,
} from "./customHints";
import { unhoverAll } from "./hoverElement";
import { scroll } from "./scroll";
import { navigateToNextPage, navigateToPreviousPage } from "./pagination";
import { blur } from "./focus";

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
			const saved = await saveCustomSelectors();
			await (saved
				? notify("Custom selectors saved", { type: "success" })
				: notify("No selectors to save", { type: "warning" }));
			break;
		}

		case "resetCustomSelectors": {
			const toUpdateSelector = await resetCustomSelectors();
			await updateCustomSelectors();
			updateHintablesBySelector(toUpdateSelector);
			await (toUpdateSelector
				? notify("Custom selectors reset", { type: "success" })
				: notify("No custom selectors found for the current page", {
						type: "warning",
				  }));
			break;
		}

		case "unhoverAll":
			blur();
			unhoverAll();
			toast.dismiss();
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
