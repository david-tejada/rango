import { type ElementWrapper } from "../../typings/ElementWrapper";
import { type RangoActionWithTarget } from "../../typings/RangoAction";
import { type TalonAction } from "../../typings/RequestFromTalon";
import { assertDefined } from "../../typings/TypingUtils";
import { notify } from "../notify/notify";
import { setLastWrapper } from "../wrappers/lastWrapper";
import { getWrapper, getWrapperForElement } from "../wrappers/wrappers";
import { copyLinkToClipboard, copyMarkdownLinkToClipboard } from "./copy";
import { markHintsForExclusion, markHintsForInclusion } from "./customHints";
import { focusAndDeleteContents } from "./focusAndDeleteContents";
import { getAnchorHrefs } from "./getAnchorHrefs";
import { hoverElement } from "./hoverElement";
import { insertToField } from "./insertToField";
import { saveReference } from "./references";
import { scroll, snapScroll } from "./scroll";
import { setSelectionAfter, setSelectionBefore } from "./setSelection";

export async function runRangoActionWithTarget(
	request: RangoActionWithTarget,
	// Used for scripting using references
	wrappersOverride?: ElementWrapper[]
): Promise<string | TalonAction[] | undefined> {
	const hints =
		typeof request.target === "string" ? [request.target] : request.target;
	const wrappers =
		wrappersOverride ??
		getWrapper(hints).filter((wrapper) => wrapper.isIntersectingViewport);

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

	// Wrapper for scroll and saving references, if there's more than one target
	// we take the first and ignore the rest
	const wrapper = wrappersOverride ? wrappersOverride[0] : wrappers[0];
	assertDefined(wrapper);
	setLastWrapper(wrapper);
	switch (request.type) {
		case "hoverElement": {
			await hoverElement(wrappers);
			break;
		}

		case "copyLink": {
			return copyLinkToClipboard(wrappers);
		}

		case "copyMarkdownLink": {
			return copyMarkdownLinkToClipboard(wrappers);
		}

		// This is not used anymore. I leave it here for now for backwards
		// compatibility - 2023-06-02
		case "insertToField": {
			await insertToField(wrappers, request.arg);
			break;
		}

		case "setSelectionBefore": {
			// This might result in a Talon time out exception if setSelectionBefofre
			// causes a navigation, as the current content script is stopped.
			await setSelectionBefore(wrapper);
			break;
		}

		case "setSelectionAfter": {
			// This might result in a Talon time out exception if setSelectionAfter
			// causes a navigation, as the current content script is stopped.
			await setSelectionAfter(wrapper);
			break;
		}

		// This is not used anymore. I leave it here for now for backwards
		// compatibility - 2023-06-02
		case "focusAndDeleteContents": {
			return focusAndDeleteContents(wrapper);
		}

		case "scrollUpAtElement": {
			scroll({ dir: "up", target: wrapper, factor: request.arg });
			break;
		}

		case "scrollDownAtElement": {
			scroll({ dir: "down", target: wrapper, factor: request.arg });
			break;
		}

		case "scrollLeftAtElement": {
			scroll({ dir: "left", target: wrapper, factor: request.arg });
			break;
		}

		case "scrollRightAtElement": {
			scroll({ dir: "right", target: wrapper, factor: request.arg });
			break;
		}

		case "scrollElementToTop": {
			snapScroll("top", wrapper);
			break;
		}

		case "scrollElementToBottom": {
			snapScroll("bottom", wrapper);
			break;
		}

		case "scrollElementToCenter": {
			snapScroll("center", wrapper);
			break;
		}

		case "includeExtraSelectors": {
			await markHintsForInclusion(wrappers);
			break;
		}

		case "excludeExtraSelectors": {
			await markHintsForExclusion(wrappers);
			break;
		}

		case "saveReference": {
			await saveReference(wrapper, request.arg);
			break;
		}

		case "hideHint": {
			for (const wrapper of wrappers) {
				wrapper.hint?.hide();
			}

			break;
		}

		default: {
			await notify(`Invalid action "${request.type}"`, {
				type: "error",
			});
			break;
		}
	}

	return undefined;
}
