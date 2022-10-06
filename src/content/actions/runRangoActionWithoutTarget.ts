import { RangoActionWithoutTarget } from "../../typings/RangoAction";
import { setNavigationToggle } from "../hints/shouldDisplayHints";
import { unhoverAll } from "./hoverElement";
import { scroll } from "./scroll";

export async function runRangoActionWithoutTarget(
	request: RangoActionWithoutTarget
): Promise<string | undefined> {
	switch (request.type) {
		case "scrollUpPage":
			scroll({ dir: "up", factor: request.arg });
			break;

		case "scrollDownPage":
			scroll({ dir: "down", factor: request.arg });
			break;

		case "scrollUpAtElement":
			scroll({ dir: "up", repeatLastScroll: true });
			break;

		case "scrollDownAtElement":
			scroll({ dir: "down", repeatLastScroll: true });
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

		// case "refreshHints": {
		// 	const running = hintables
		// 		.getAll({
		// 			clickable: true,
		// 		})
		// 		.map(async (hintable) => hintable.update());
		// 	await Promise.allSettled(running);
		// 	break;
		// }

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
