import { RangoActionWithoutTarget } from "../../typings/RangoAction";
import { triggerHintsUpdate } from "../hints/triggerHintsUpdate";
import { setNavigationToggle } from "../hints/shouldDisplayHints";
import { unhoverAll } from "./hoverElement";
import { scrollPageVertically } from "./scroll";

export async function runRangoActionWithoutTarget(
	request: RangoActionWithoutTarget
): Promise<string | undefined> {
	switch (request.type) {
		case "scrollUpPage":
			scrollPageVertically("up", request.arg);
			break;

		case "scrollDownPage":
			scrollPageVertically("down", request.arg);
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
			await triggerHintsUpdate(true);
			break;

		case "enableHintsNavigation":
			setNavigationToggle(true);
			await triggerHintsUpdate(true);
			break;

		case "disableHintsNavigation":
			setNavigationToggle(false);
			await triggerHintsUpdate(true);
			break;

		default:
			break;
	}

	return undefined;
}
