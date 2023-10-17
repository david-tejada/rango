import { RangoActionWithTargets } from "../../typings/RangoAction";
import { notify } from "../notify/notify";
import { runRangoActionWithTarget } from "./runRangoActionWithTarget";
import { getWrapperFromUniqueSelector, withHostReferences } from "./references";

export async function runActionOnReference(
	type: RangoActionWithTargets["type"],
	name: string
) {
	await withHostReferences(async (hostReferences) => {
		if (!hostReferences?.has(name)) {
			await notify(`Reference "${name}" is not saved in the current context`, {
				type: "error",
			});
			return;
		}

		const selector = hostReferences.get(name)!;
		const wrapper = getWrapperFromUniqueSelector(selector);

		if (!wrapper) {
			await notify(`Unable to find element for reference "${name}"`, {
				type: "error",
			});

			return;
		}

		await runRangoActionWithTarget({ type, target: [] }, [wrapper]);
	});
}
