import tippy from "tippy.js";
import { Intersector, HintedIntersector } from "../../typing/types";
import { applyEmphasisStyles, applyInitialStyles } from "./styles";

export function showTooltip(
	target: Intersector,
	text: string,
	duration: number
) {
	const hintElement = target.hintElement as HTMLElement;
	hintElement.id = "rango-tooltip";
	hintElement.dataset["tippyContent"] = text;
	const instance = tippy(hintElement, {
		zIndex: 2_147_483_647,
		appendTo: hintElement.parentElement!,
		maxWidth: "none",
	});
	instance.show();
	applyEmphasisStyles(target as HintedIntersector, false);
	setTimeout(() => {
		applyInitialStyles(target as HintedIntersector);
		instance.hide();
		hintElement.removeAttribute("id");
	}, duration);
}
