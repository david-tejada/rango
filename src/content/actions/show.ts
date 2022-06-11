import { getIntersectorWithHint } from "../intersectors";
import { showTooltip } from "../hints/tooltip";

export function showLink(hintText: string) {
	const target = getIntersectorWithHint(hintText);
	if (target) {
		const href = (target.element as HTMLLinkElement).href;
		showTooltip(target, href, 5000);
	}
}
