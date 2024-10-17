import browser from "webextension-polyfill";
import { type ElementWrapper } from "../../typings/ElementWrapper";
import { assertDefined } from "../../typings/TypingUtils";

export async function openInNewTab(wrappers: ElementWrapper[]) {
	const [first, ...rest] = wrappers;

	assertDefined(first);
	first.hint?.flash();
	if (first.element instanceof HTMLAnchorElement) {
		void browser.runtime.sendMessage({
			type: "openInNewTab",
			url: first.element.href,
		});
	}

	if (rest.length > 0) {
		void openInBackgroundTab(rest);
	}
}

export async function openInBackgroundTab(wrappers: ElementWrapper[]) {
	const links: string[] = [];
	const anchorWrappers: ElementWrapper[] = [];

	for (const wrapper of wrappers) {
		if (wrapper.element instanceof HTMLAnchorElement) {
			anchorWrappers.push(wrapper);
			links.push(wrapper.element.href);
		}
	}

	if (links.length > 0) {
		for (const wrapper of anchorWrappers) {
			wrapper.hint?.flash();
		}

		await browser.runtime.sendMessage({
			type: "openInBackgroundTab",
			links,
		});
	}
}
