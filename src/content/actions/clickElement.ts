import { type ElementWrapper } from "../../typings/ElementWrapper";
import { sendMessage } from "../messaging/contentMessageBroker";

export async function clickElement(wrappers: ElementWrapper[]) {
	for (const wrapper of wrappers) wrapper.hint?.flash();

	let focusPage = false;
	const anchors = wrappers
		.map((wrapper) => wrapper.element)
		.filter((element) => element instanceof HTMLAnchorElement);
	const nonAnchorWrappers = wrappers.filter(
		(wrapper) => !(wrapper.element instanceof HTMLAnchorElement)
	);

	// If there are multiple targets and some of them are anchor elements we open
	// those in a new inactive tab.
	if (wrappers.length > 1 && anchors.length > 0) {
		await sendMessage("createTabs", {
			createPropertiesArray: anchors.map((anchor) => ({
				url: anchor.href,
				active: false,
			})),
		});
	}

	for (const wrapper of nonAnchorWrappers) {
		const shouldFocusPage = wrapper.click();
		if (shouldFocusPage) focusPage = true;
	}

	if (
		wrappers.length === 1 &&
		wrappers[0]!.element instanceof HTMLSelectElement
	) {
		return { focusPage, isSelect: true };
	}

	return { focusPage };
}
