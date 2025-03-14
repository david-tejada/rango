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
	const { results } = await sendMessageToTargetFrames("clickElement", {
		target,
		isSingleTarget,
	});

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
		const { results } = await sendMessageToTargetFrames("clickElement", {
			target,
			isSingleTarget,
		});

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
