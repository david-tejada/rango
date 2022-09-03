import { RangoAction } from "../../typings/RangoAction";
import { assertDefined } from "../../typings/TypingUtils";
import { getCurrentTabId } from "../utils/getCurrentTab";
import { focusedDocumentInTab } from "../utils/focusedDocumentInTab";
import { getStack } from "../utils/hintsAllocator";

export async function isUnintendedDirectClicking(
	command: RangoAction
): Promise<boolean> {
	if (command.type !== "directClickElement") {
		return false;
	}

	if (command.target.length > 1) {
		return false;
	}

	const hint = command.target[0];
	assertDefined(hint);

	const currentTabId = await getCurrentTabId();
	const stack = await getStack(currentTabId);
	const hintExistsInTab = stack.assigned.has(hint);

	return !(hintExistsInTab && (await focusedDocumentInTab(currentTabId)));
}
