import { RangoActionWithTarget } from "../../typings/RangoAction";
import { assertDefined } from "../../typings/TypingUtils";
import { hintables } from "../hints/hintables";
// import { getHintablesByHint } from "../intersectors";
import { clickElement } from "./clickElement";
import {
	copyElementTextContentToClipboard,
	copyLinkToClipboard,
	copyMarkdownLinkToClipboard,
} from "./copy";
import { hoverElement } from "./hoverElement";
import { openInBackgroundTab, openInNewTab } from "./openInNewTab";
import {
	scrollElementToBottom,
	scrollElementToCenter,
	scrollElementToTop,
	scrollVerticallyAtElement,
} from "./scroll";
import { showTitleAndHref } from "./showTitleAndHref";

export async function runRangoActionWithTarget(
	request: RangoActionWithTarget
): Promise<string | undefined> {
	const hints =
		typeof request.target === "string" ? [request.target] : request.target;
	const intersectors = hintables.getByHint(hints);

	// Element for scroll, if there's more than one target we take the first and ignore the rest
	const element = intersectors[0]?.element;
	assertDefined(element);

	switch (request.type) {
		case "clickElement":
		case "directClickElement":
			await clickElement(intersectors);
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

	return undefined;
}
