import { RangoActionWithoutTarget } from "../../typings/RangoAction";
import { setNavigationToggle } from "../hints/shouldDisplayHints";
import { cacheHintOptions } from "../options/cacheHintOptions";
import {
	displayLessHints,
	displayMoreHints,
	refreshHints,
	updateHintsStyle,
} from "../Wrapper";
import { unhoverAll } from "./hoverElement";
import { scroll } from "./scroll";

export async function runRangoActionWithoutTarget(
	request: RangoActionWithoutTarget
): Promise<string | undefined> {
	switch (request.type) {
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

		case "displayMoreHints":
			displayMoreHints();
			break;

		case "displayLessHints":
			displayLessHints();
			break;

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
			refreshHints();
			break;

		case "refreshHintsOnIdle":
			await cacheHintOptions();
			window.requestIdleCallback(async () => {
				refreshHints();
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

		case "enableHintsNavigation":
			setNavigationToggle(true);
			// await triggerHintsUpdate(true);
			break;

		case "disableHintsNavigation":
			setNavigationToggle(false);
			// await triggerHintsUpdate(true);
			break;

		default:
			break;
	}

	return undefined;
}
