import tippy from "tippy.js";
import { applyEmphasisStyles, applyInitialStyles } from "../lib/styles";
import { intersectors } from "./intersectors";

export function copyLink(hintText: string) {
	const target = intersectors.find(
		(intersector) => intersector.hintText === String(hintText)
	);
	if ((target?.element as HTMLLinkElement).href) {
		const hintElement = target!.hintElement as HTMLElement;
		hintElement.id = "rango-tooltip-link-copied";
		hintElement.dataset["tippyContent"] = "Link copied!";
		const instance = tippy(hintElement, {
			zIndex: 2_147_483_647,
			appendTo: hintElement.parentElement!,
		});
		applyEmphasisStyles(target!, false);
		instance.show();
		setTimeout(() => {
			applyInitialStyles(target!);
			instance.hide();
			hintElement.removeAttribute("id");
		}, 1500);
		return (target?.element as HTMLLinkElement).href;
	}

	return undefined;
}
