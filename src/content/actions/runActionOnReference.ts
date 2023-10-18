import { promiseWrap } from "../../lib/promiseWrap";
import { RangoActionWithTargets } from "../../typings/RangoAction";
import { notify } from "../notify/notify";
import { querySelectorWithWait } from "../utils/domUtils";
import { getOrCreateWrapper } from "../wrappers/ElementWrapperClass";
import { withHostReferences } from "./references";
import { runRangoActionWithTarget } from "./runRangoActionWithTarget";

export async function runActionOnReference(
	type: RangoActionWithTargets["type"],
	name: string
) {
	await withHostReferences(async (hostReferences) => {
		const selector = hostReferences.get(name)!;

		if (!selector) {
			return notify(`Reference "${name}" is not saved in the current context`, {
				type: "error",
			});
		}

		const [element] = await promiseWrap<Element>(
			querySelectorWithWait(selector, 1000)
		);

		if (!element) {
			return notify(`Unable to find element for reference "${name}"`, {
				type: "error",
			});
		}

		const wrapper = getOrCreateWrapper(element, false);
		await runRangoActionWithTarget({ type, target: [] }, [wrapper]);
	});
}
