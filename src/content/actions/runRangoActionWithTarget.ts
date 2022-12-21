import { RangoActionWithTarget } from "../../typings/RangoAction";
import { assertDefined } from "../../typings/TypingUtils";
import { getWrapper } from "../wrappers";
import { clickElement } from "./clickElement";
import {
	copyElementTextContentToClipboard,
	copyLinkToClipboard,
	copyMarkdownLinkToClipboard,
} from "./copy";
import { scroll, snapScroll } from "./scroll";
import { hoverElement } from "./hoverElement";
import { openInBackgroundTab, openInNewTab } from "./openInNewTab";
import { showTitleAndHref } from "./showTitleAndHref";
import { includeOrExcludeExtraSelectors } from "./customHints";
import { insertToField } from "./insertToField";
import { setSelectionAfter, setSelectionBefore } from "./setSelection";
import { clearAndSetSelection } from "./clearAndSetSelection";

export async function runRangoActionWithTarget(
	request: RangoActionWithTarget
): Promise<string | undefined> {
	const hints =
		typeof request.target === "string" ? [request.target] : request.target;
	const wrappers = getWrapper(hints);

	// Wrapper for scroll, if there's more than one target we take the first and ignore the rest
	const wrapper = wrappers[0];
	assertDefined(wrapper);

	switch (request.type) {
		case "clickElement":
		case "directClickElement":
			await clickElement(wrappers);
			break;

		case "showLink":
			showTitleAndHref(wrappers);
			break;

		case "openInNewTab":
			await openInNewTab(wrappers);
			break;

		case "openInBackgroundTab":
			await openInBackgroundTab(wrappers);
			break;

		case "hoverElement":
			await hoverElement(wrappers);
			break;

		case "copyLink":
			return copyLinkToClipboard(wrappers);

		case "copyMarkdownLink":
			return copyMarkdownLinkToClipboard(wrappers);

		case "copyElementTextContent":
			return copyElementTextContentToClipboard(wrappers);

		case "insertToField":
			insertToField(wrappers, request.arg);
			break;

		case "setSelectionBefore":
			setSelectionBefore(wrapper);
			break;

		case "setSelectionAfter":
			setSelectionAfter(wrapper);
			break;

		case "clearAndSetSelection":
			clearAndSetSelection(wrapper);
			break;

		case "scrollUpAtElement":
			scroll({ dir: "up", target: wrapper, factor: request.arg });
			break;

		case "scrollDownAtElement":
			scroll({ dir: "down", target: wrapper, factor: request.arg });
			break;

		case "scrollLeftAtElement":
			scroll({ dir: "left", target: wrapper, factor: request.arg });
			break;

		case "scrollRightAtElement":
			scroll({ dir: "right", target: wrapper, factor: request.arg });
			break;

		case "scrollElementToTop":
			snapScroll("top", wrapper);
			break;

		case "scrollElementToBottom":
			snapScroll("bottom", wrapper);
			break;

		case "scrollElementToCenter":
			snapScroll("center", wrapper);
			break;

		case "includeExtraSelectors":
			includeOrExcludeExtraSelectors(wrappers, "include");
			break;

		case "excludeExtraSelectors":
			includeOrExcludeExtraSelectors(wrappers, "exclude");
			break;

		default:
			break;
	}

	return undefined;
}
