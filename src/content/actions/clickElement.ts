import { ElementWrapper } from "../../typings/ElementWrapper";
import { openInBackgroundTab } from "./openInNewTab";

export async function clickElement(wrappers: ElementWrapper[]) {
	// If there are multiple targets and some of them are anchor elements we open
	// those in a new background tab
	if (wrappers.length > 1) {
		const anchorWrappers = wrappers.filter(
			(hintable) => hintable.element instanceof HTMLAnchorElement
		);
		wrappers = wrappers.filter(
			(hintable) => !(hintable.element instanceof HTMLAnchorElement)
		);
		await openInBackgroundTab(anchorWrappers);
	}

	for (const wrapper of wrappers) {
		wrapper.click();
	}
}
