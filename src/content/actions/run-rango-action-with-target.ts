import { RangoActionWithTarget, ScriptResponse } from "../../typing/types";
import { assertDefined } from "../../typing/typing-utils";
import { NoHintError } from "../classes/errors";
import { getIntersectorsByHints } from "../intersectors";
import { clickElements } from "./click-element";
import {
	copyElementTextContentToClipboard,
	copyLinkToClipboard,
	copyMarkdownLinkToClipboard,
} from "./copy";
import { hoverElement } from "./hover";
import { openInBackgroundTab, openInNewTab } from "./open-in-new-tab";
import {
	scrollElementToBottom,
	scrollElementToCenter,
	scrollElementToTop,
	scrollVerticallyAtElement,
} from "./scroll";
import { showTitleAndHref } from "./show";

export async function runRangoActionWithTarget(
	request: RangoActionWithTarget
): Promise<ScriptResponse | undefined> {
	const hints =
		typeof request.target === "string" ? [request.target] : request.target;
	const intersectors = getIntersectorsByHints(hints);

	// Element for scroll, if there's more than one target we take the first and ignore the rest
	const element = intersectors[0]?.element;
	assertDefined(element);

	try {
		switch (request.type) {
			case "clickElement":
			case "directClickElement":
				await clickElements(intersectors);
				break;

			case "showLink":
				showTitleAndHref(intersectors);
				break;

			case "openInNewTab":
				await openInNewTab(intersectors);
				break;

			case "openInBackgroundTab":
				await openInBackgroundTab(intersectors);
				break;

			case "hoverElement":
				await hoverElement(intersectors);
				break;

			case "copyLink":
				return copyLinkToClipboard(intersectors);

			case "copyMarkdownLink":
				return copyMarkdownLinkToClipboard(intersectors);

			case "copyElementTextContent":
				return copyElementTextContentToClipboard(intersectors);

			case "scrollUpAtElement":
				scrollVerticallyAtElement("up", element, request.arg);
				break;

			case "scrollDownAtElement":
				scrollVerticallyAtElement("down", element, request.arg);
				break;

			case "scrollElementToTop":
				scrollElementToTop(element);
				break;

			case "scrollElementToBottom":
				scrollElementToBottom(element);
				break;

			case "scrollElementToCenter":
				scrollElementToCenter(element);
				break;

			default:
				break;
		}
	} catch (error: unknown) {
		if (request.type === "directClickElement" && error instanceof NoHintError) {
			return {
				talonAction: {
					type: "noHintFound",
				},
			};
		}
	}

	return undefined;
}
