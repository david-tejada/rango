import { arrayToTarget } from "../../common/target/targetConversion";
import {
	type TabMark,
	type TabMarkerMark,
	type Target,
} from "../../typings/Target/Target";
import { getTabIdForMarker } from "../tabs/tabMarkers";

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

export function getTargetFromTabMarkers(target: string[]) {
	return arrayToTarget<TabMarkerMark>(target, "tabMarker");
}
