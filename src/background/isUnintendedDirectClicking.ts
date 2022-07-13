import { RangoAction } from "../typing/types";
import { assertDefined } from "../typing/typing-utils";
import { getCurrentTabId } from "./current-tab";
import { documentWithFocusInTab } from "./documentWithFocusInTab";
import { getStack } from "./hints-allocator";

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

	return !(hintExistsInTab && (await documentWithFocusInTab(currentTabId)));
}
