import { sendMessage } from "webext-bridge/content-script";
import { type ElementWrapper } from "../../typings/ElementWrapper";
import { assertDefined } from "../../typings/TypingUtils";

export async function openInNewTab(wrappers: ElementWrapper[]) {
	const first = wrappers[0];
	const rest = wrappers.slice(1);

	assertDefined(first);
	first.hint?.flash();
	if (first.element instanceof HTMLAnchorElement) {
		await sendMessage(
			"openInNewTab",
			{ url: first.element.href },
			"background"
		);
	}

	if (rest.length > 0) {
		void openInBackgroundTab(rest);
	}
}

export async function openInBackgroundTab(wrappers: ElementWrapper[]) {
	const urls: string[] = [];
	const anchorWrappers: ElementWrapper[] = [];

	for (const wrapper of wrappers) {
		if (wrapper.element instanceof HTMLAnchorElement) {
			anchorWrappers.push(wrapper);
			urls.push(wrapper.element.href);
		}
	}

	if (urls.length > 0) {
		for (const wrapper of anchorWrappers) {
			wrapper.hint?.flash();
		}

		await sendMessage("openInBackgroundTab", { urls }, "background");
	}
}
