import { ElementWrapper } from "../../typings/ElementWrapper";
import { TalonAction } from "../../typings/RequestFromTalon";
import { openInBackgroundTab } from "./openInNewTab";

export async function clickElement(
	wrappers: ElementWrapper[]
): Promise<TalonAction | undefined> {
	let performPageFocus = false;
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
		const shouldFocusPage = wrapper.click();
		if (shouldFocusPage) performPageFocus = true;
	}

	if (
		wrappers.length === 1 &&
		wrappers[0]!.element instanceof HTMLSelectElement
	) {
		return {
			type: "key",
			key: "alt-down",
		};
	}

	if (performPageFocus) {
		return { type: "focusPage" };
	}

	return undefined;
}
