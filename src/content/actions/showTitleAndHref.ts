import { showTooltip } from "../hints/showTooltip";
import { type ElementWrapper } from "../wrappers/ElementWrapper";

export function showTitleAndHref(wrappers: ElementWrapper[]) {
	for (const wrapper of wrappers) {
		const element = wrapper.element;
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

		if (result) showTooltip(wrapper, result, 5000);
	}
}
