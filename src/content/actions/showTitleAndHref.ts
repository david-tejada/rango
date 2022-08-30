import { showTooltip } from "../hints/showTooltip";
// import { flashHint } from "../hints/applyInitialStyles";
import { HintedIntersector } from "../../typings/Intersector";

export function showTitleAndHref(intersectors: HintedIntersector[]) {
	for (const intersector of intersectors) {
		const element = intersector.element;
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
			showTooltip(intersector, result, 5000);
		} else {
			// flashHint(intersector);
		}
	}
}
