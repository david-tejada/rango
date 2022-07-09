import {
	RangoActionWithoutTarget,
	ScriptResponse,
	WindowLocationKeys,
} from "../../typing/types";
import { triggerHintsUpdate } from "../hints/display-hints";
import { setNavigationToggle } from "../hints/should-display-hints";
import { copyToClipboardResponse } from "./copy";
import { unhoverAll } from "./hover";
import { scrollPageVertically } from "./scroll";

export async function runRangoActionWithoutTarget(
	request: RangoActionWithoutTarget
): Promise<ScriptResponse | undefined> {
	switch (request.type) {
		case "scrollUpPage":
			scrollPageVertically("up", request.arg);
			break;

		case "scrollDownPage":
			scrollPageVertically("down", request.arg);
			break;

		case "copyLocationProperty":
			return copyToClipboardResponse(
				window.location[request.arg as WindowLocationKeys]
			);

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
