import { promiseWrap } from "../../lib/promiseWrap";
import { RangoActionWithTargets } from "../../typings/RangoAction";
import { querySelectorWithWait } from "../utils/domUtils";
import { getOrCreateWrapper } from "../wrappers/ElementWrapperClass";
import { getReferences } from "./references";
import { runRangoActionWithTarget } from "./runRangoActionWithTarget";

export async function runActionOnReference(
	type: RangoActionWithTargets["type"],
	name: string
) {
	const { hostReferences } = await getReferences();
	const selector = hostReferences.get(name)!;

	if (!selector) {
		return false;
	}

	const [element] = await promiseWrap<Element>(
		querySelectorWithWait(selector, 1000)
	);

	if (!element) {
		return false;
	}

	const wrapper = getOrCreateWrapper(element, false);
	await runRangoActionWithTarget({ type, target: [] }, [wrapper]);
	return true;
}
