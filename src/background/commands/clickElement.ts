import { settings } from "../../common/settings/settings";
import { isTargetError } from "../../common/target/TargetError";
import { type TalonAction } from "../../typings/TalonAction";
import { type ElementMark, type Target } from "../../typings/Target/Target";
import { sendMessage } from "../messaging/sendMessage";
import { sendMessageToAllFrames } from "../messaging/sendMessageToAllFrames";
import { sendMessageToTargetFrames } from "../messaging/sendMessageToTargetFrames";
import { UnreachableContentScriptError } from "../messaging/UnreachableContentScriptError";
import { promiseWrap } from "../utils/promises";

export async function clickElement(target: Target<ElementMark>) {
	const isSingleTarget = target.type === "primitive";
	const results = await sendClickToTargetFrames(target, isSingleTarget);

	await sendMessageToAllFrames("updateNavigationToggle", {});

	// This is just to be extra safe since if there are multiple targets the
	// result of each frame must be undefined.
	return isSingleTarget ? results[0] : undefined;
}

export async function directClickElement(
	target: Target<ElementMark>
): Promise<TalonAction | TalonAction[] | undefined> {
	const isSingleTarget = target.type === "primitive";

	// Handle the possibility that the user might have intended to type those
	// characters.
	if (isSingleTarget) {
		const directClickWithNoFocusedDocument = await settings.get(
			"directClickWithNoFocusedDocument"
		);

		if (!directClickWithNoFocusedDocument) {
			const [focusedDocument] = await promiseWrap(
				sendMessage("checkIfDocumentHasFocus")
			);

			if (!focusedDocument) {
				return { name: "typeTargetCharacters" };
			}
		}

		const directClickWhenEditing = await settings.get("directClickWhenEditing");

		if (!directClickWhenEditing) {
			const { results } = await sendMessageToAllFrames(
				"hasActiveEditableElement"
			);

			if (results.includes(true)) return { name: "typeTargetCharacters" };
		}
	}

	try {
		const results = await sendClickToTargetFrames(target, isSingleTarget);

		await sendMessageToAllFrames("updateNavigationToggle", {});

		// This is just to be extra safe since if there are multiple targets the
		// result of each frame must be undefined.
		return isSingleTarget ? results[0] : undefined;
	} catch (error: unknown) {
		if (
			target.type === "primitive" &&
			(error instanceof UnreachableContentScriptError || isTargetError(error))
		) {
			return { name: "typeTargetCharacters" };
		}

		throw error;
	}
}

/**
 * Sends `clickElement` to the frames that own the target and returns their
 * results.
 */
async function sendClickToTargetFrames(
	target: Target<ElementMark>,
	isSingleTarget: boolean
) {
	try {
		const { results } = await sendMessageToTargetFrames("clickElement", {
			target,
			isSingleTarget,
		});
		return results;
	} catch (error: unknown) {
		// A click that navigates can leave the page before its content script
		// replies. The click already happened and there is nothing left to do on
		// a page we have left, so it isn't a failure.
		if (isPageLeftError(error)) return [];

		throw error;
	}
}

/**
 * Returns true if the error is what the browser reports when the page left
 * before its content script could reply.
 */
function isPageLeftError(error: unknown) {
	if (!(error instanceof Error)) return false;

	// Chrome closes the message channel when the page moves into the
	// back/forward cache. Firefox drops the listener, which reads as if the frame
	// had never been there. That message is also what we get when the frame was
	// removed before the click arrived, but that is rare enough that doing
	// nothing beats an error for every click that navigates.
	return (
		error.message.includes("moved into back/forward cache") ||
		error.message ===
			"Could not establish connection. Receiving end does not exist."
	);
}
