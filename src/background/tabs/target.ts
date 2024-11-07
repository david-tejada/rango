import { arrayToTarget } from "../../common/target/targetConversion";
import {
	type TabHintMark,
	type TabMark,
	type Target,
} from "../../typings/Target/Target";
import { getTabIdForMarker } from "../misc/tabMarkers";

export async function getTabIdsFromTarget(
	target: Target<TabMark>
): Promise<number[]> {
	if (target.type === "list") {
		return Promise.all(
			target.items.map(async (item) => getTabIdForMarker(item.mark.value))
		);
	}

	return [await getTabIdForMarker(target.mark.value)];
}

export function getTargetFromTabHints(target: string[]) {
	return arrayToTarget<TabHintMark>(target, "tabHint");
}
