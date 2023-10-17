import { RangoActionWithTargets } from "../../typings/RangoAction";
import { notify } from "../notify/notify";
import { runRangoActionWithTarget } from "./runRangoActionWithTarget";
import {
	getReferencesForCurrentUrl,
	getWrapperFromUniqueSelector,
} from "./references";

export async function runActionOnReference(
	type: RangoActionWithTargets["type"],
	name: string
) {
	const referencesForUrl = await getReferencesForCurrentUrl();
	console.log(referencesForUrl);

	if (!referencesForUrl?.has(name)) {
		await notify(`Reference "${name}" is not saved in the current context`, {
			type: "error",
		});
		return;
	}

	const uniqueSelector = referencesForUrl.get(name)!;
	const wrapper = getWrapperFromUniqueSelector(uniqueSelector);

	if (!wrapper) {
		await notify(`Unable to find element for reference "${name}"`, {
			type: "error",
		});

		return;
	}

	await runRangoActionWithTarget({ type, target: [] }, [wrapper]);
}
