import { getIntersectorWithHint } from "../intersectors";
import { showTooltip } from "../hints/tooltip";
import { flashHint } from "../hints/styles";
import { HintedIntersector } from "../../typing/types";

export function showTitleAndHref(hintText: string) {
	const target = getIntersectorWithHint(hintText);
	const element = target.element;
	let result = "";
	let title = "";

	if (element instanceof HTMLElement) {
		if (element.title) {
			title = element.title;
		} else {
			const subnodeWithTitle = element.querySelector("[title");
			if (subnodeWithTitle instanceof HTMLElement && subnodeWithTitle.title) {
				title = subnodeWithTitle.title;
			}
		}
	}

	if (element instanceof HTMLAnchorElement) {
		result = title
			? `<div><strong>${title}</strong></div><div>${element.href}</div>`
			: `<div>${element.href}</div>`;
	} else {
		result = title;
	}

	if (result) {
		showTooltip(target, result, 5000);
	} else {
		flashHint(target as HintedIntersector);
	}
}
