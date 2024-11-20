import { showTooltip } from "../hints/showTooltip";
import { type ElementWrapper } from "../wrappers/ElementWrapper";

export async function getAnchorHref(
	wrappers: ElementWrapper[],
	copyTooltip = false
) {
	if (copyTooltip) {
		for (const wrapper of wrappers) {
			if (wrapper.element instanceof HTMLAnchorElement) {
				showTooltip(wrapper, "Copied!", 1500);
			} else {
				showTooltip(wrapper, "Not a link", 1500);
			}
		}
	}

	return wrappers
		.map((wrapper) => wrapper.element)
		.filter((element) => element instanceof HTMLAnchorElement)
		.map((element) => element.href);
}
