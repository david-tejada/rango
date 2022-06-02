import { getIntersectorWithHint } from "./intersectors";
import { showTooltip } from "./tooltip";

export function copyLink(hintText: string) {
	const target = getIntersectorWithHint(hintText);
	if (target && (target?.element as HTMLLinkElement).href) {
		showTooltip(target, "Copied!", 1500);
		return (target?.element as HTMLLinkElement).href;
	}

	return undefined;
}

export function showLink(hintText: string) {
	const target = getIntersectorWithHint(hintText);
	if (target) {
		const href = (target.element as HTMLLinkElement).href;
		showTooltip(target, href, 5000);
	}
}
