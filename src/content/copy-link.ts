import { intersectors } from "./intersectors";
import { showTooltip } from "./tooltip";

export function copyLink(hintText: string) {
	const target = intersectors.find(
		(intersector) => intersector.hintText === String(hintText)
	);
	if (target && (target?.element as HTMLLinkElement).href) {
		showTooltip(target, "Copied!");
		return (target?.element as HTMLLinkElement).href;
	}

	return undefined;
}
