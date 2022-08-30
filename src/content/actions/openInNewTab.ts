import browser from "webextension-polyfill";
import { assertDefined } from "../../typings/TypingUtils";
import { Hintable } from "../Hintable";

export async function openInNewTab(hintables: Hintable[]) {
	const first = hintables[0];
	const rest = hintables.slice(1);

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

export async function openInBackgroundTab(hintables: Hintable[]) {
	const links = [];
	const anchorHintables = [];

	for (const hintable of hintables) {
		if (hintable.element instanceof HTMLAnchorElement) {
			anchorHintables.push(hintable);
			links.push(hintable.element.href);
		}
	}

	if (links.length > 0) {
		for (const hintable of anchorHintables) {
			hintable.hint?.flash();
		}

		await browser.runtime.sendMessage({
			type: "openInBackgroundTab",
			links,
		});
	}
}
