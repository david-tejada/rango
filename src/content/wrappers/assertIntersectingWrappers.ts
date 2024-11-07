import { TargetError } from "../../common/target/TargetError";
import { type ElementWrapper } from "../../typings/ElementWrapper";

export function assertWrappersIntersectViewport(wrappers: ElementWrapper[]) {
	for (const wrapper of wrappers) {
		if (!wrapper.isIntersectingViewport) {
			throw new TargetError(
				`Couldn't find mark "${wrapper.hint?.string}" in viewport.`
			);
		}
	}
}
