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
	const { results } = await sendMessageToTargetFrames("clickElement", {
		target,
		isSingleTarget: target.type === "primitive",
	});

	return handleClickResults(results);
}

export async function directClickElement(
	target: Target<ElementMark>
): Promise<TalonAction | TalonAction[]> {
	// Handle the possibility that the user might have intended to type those
	// characters.
	if (target.type === "primitive") {
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
			isSingleTarget: target.type === "primitive",
		});

		return handleClickResults(results);
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

export function handleClickResults(
	results: Awaited<
		ReturnType<typeof sendMessageToTargetFrames<"clickElement">>
	>["results"]
) {
	const focusPage = results.find((value) => value?.focusPage);

	// We can't open multiple selects and I don't think it's safe to press keys
	// if there have been multiple things clicked.
	const isSelect = results.length === 1 && results[0]?.isSelect;

	const actions: TalonAction[] = [];
	if (focusPage) actions.push({ name: "focusPage" });
	if (isSelect)
		actions.push({
			name: "key",
			key: "alt-down",
		});

	if (results.length === 1 && results[0]?.isCopyToClipboardButton) {
		actions.push(
			{ name: "sleep", ms: 50 },
			{
				name: "key",
				key: "enter",
			}
		);
	}

	return actions;
}
