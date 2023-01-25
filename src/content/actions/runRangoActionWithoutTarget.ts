import { RangoActionWithoutTarget } from "../../typings/RangoAction";
import { setNavigationToggle } from "../hints/shouldDisplayHints";
import { updateHintsEnabled } from "../observe";
import { cacheHintOptions } from "../options/cacheHintOptions";
import {
	displayMoreOrLessHints,
	refreshHints,
	updateHintablesBySelector,
	updateHintsStyle,
} from "../updateWrappers";
import { updateCustomSelectors } from "../hints/selectors";
import { resetCustomSelectors } from "../hints/customHintsEdit";
import {
	includeOrExcludeMoreOrLessSelectors,
	saveCustomSelectors,
} from "./customHints";
import { unhoverAll } from "./hoverElement";
import { scroll } from "./scroll";
import { navigateToNextPage, navigateToPreviousPage } from "./pagination";

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

		case "confirmSelectorsCustomization":
			await saveCustomSelectors();
			break;

		case "resetCustomSelectors": {
			const toUpdateSelector = await resetCustomSelectors();
			await updateCustomSelectors();
			updateHintablesBySelector(toUpdateSelector);
			break;
		}

		case "copyLocationProperty":
			return window.location[
				request.arg as
					| "href"
					| "hostname"
					| "host"
					| "origin"
					| "pathname"
					| "port"
					| "protocol"
			];

		case "unhoverAll":
			unhoverAll();
			break;

		case "refreshHints":
			await cacheHintOptions();
			await refreshHints();
			break;

		case "refreshHintsOnIdle":
			await cacheHintOptions();
			window.requestIdleCallback(async () => {
				await refreshHints();
			});
			break;

		case "updateHintsStyle":
			await cacheHintOptions();
			updateHintsStyle();
			break;

		case "updateHintsStyleOnIdle":
			window.requestIdleCallback(async () => {
				await cacheHintOptions();
				updateHintsStyle();
			});
			break;

		case "updateHintsEnabled":
			await updateHintsEnabled();
			break;

		case "updateHintsEnabledOnIdle":
			window.requestIdleCallback(async () => {
				await updateHintsEnabled();
			});

			break;

		case "enableHintsNavigation":
			setNavigationToggle(true);
			break;

		case "disableHintsNavigation":
			setNavigationToggle(false);
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
