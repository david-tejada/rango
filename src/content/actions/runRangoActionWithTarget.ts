import { RangoActionWithTarget } from "../../typings/RangoAction";
import { assertDefined } from "../../typings/TypingUtils";
import { getWrapper, getWrapperForElement } from "../wrappers/wrappers";
import { TalonAction } from "../../typings/RequestFromTalon";
import { tryToFocusOnEditable } from "../utils/tryToFocusOnEditable";
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
import { focusAndDeleteContents } from "./focusAndDeleteContents";
import { focus } from "./focus";

export async function runRangoActionWithTarget(
	request: RangoActionWithTarget
): Promise<string | TalonAction[] | undefined> {
	const hints =
		typeof request.target === "string" ? [request.target] : request.target;
	const wrappers = getWrapper(hints).filter(
		(wrapper) => wrapper.isIntersectingViewport
	);

	// If the user says, for example, "pre cap" and the element with the hint "c"
	// is actually already focused but the document itself is not focused, once we
	// focus the document the hint will disappear and we won't get any wrappers
	// with that hint.
	if (wrappers.length === 0) {
		if (
			request.type === "setSelectionAfter" ||
			request.type === "setSelectionBefore" ||
			request.type === "tryToFocusElementAndCheckIsEditable"
		) {
			const activeElementWrapper = document.activeElement
				? getWrapperForElement(document.activeElement)
				: undefined;
			if (activeElementWrapper) {
				wrappers.push(activeElementWrapper);
			}
		} else {
			// We don't need to worry about the number of hints said, if it was more
			// than one the action would have changed to "clickElement"
			return request.type === "directClickElement"
				? [{ name: "typeTargetCharacters" }]
				: undefined;
		}
	}

	// Wrapper for scroll, if there's more than one target we take the first and
	// ignore the rest
	const wrapper = wrappers[0];
	assertDefined(wrapper);

	switch (request.type) {
		case "clickElement":
		case "directClickElement":
			return clickElement(wrappers);

		case "tryToFocusElementAndCheckIsEditable": {
			// This might result in a Talon time out exception if tryToFocusOnEditable
			// causes a navigation, as the current content script is stopped.
			const isEditable = await tryToFocusOnEditable(wrapper);
			return [{ name: "responseValue", value: isEditable }];
		}

		case "focusElement":
			return focus(wrappers);

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

		// This is not used anymore. I leave it here for now for backwards
		// compatibility - 2023-06-02
		case "insertToField":
			await insertToField(wrappers, request.arg);
			break;

		case "setSelectionBefore":
			// This might result in a Talon time out exception if setSelectionBefofre
			// causes a navigation, as the current content script is stopped.
			await setSelectionBefore(wrapper);
			break;

		case "setSelectionAfter":
			// This might result in a Talon time out exception if setSelectionAfter
			// causes a navigation, as the current content script is stopped.
			await setSelectionAfter(wrapper);
			break;

		// This is not used anymore. I leave it here for now for backwards
		// compatibility - 2023-06-02
		case "focusAndDeleteContents":
			return focusAndDeleteContents(wrapper);

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
