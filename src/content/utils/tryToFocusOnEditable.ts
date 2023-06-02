import { sleep } from "../../lib/utils";
import { ElementWrapper } from "../../typings/ElementWrapper";
import { notify } from "../notify/notify";
import { elementIsEditable } from "./domUtils";

async function waitActiveElementIsEditable(): Promise<boolean> {
	return new Promise((resolve) => {
		let timedOut = false;

		const timeout = setTimeout(() => {
			timedOut = true;
			resolve(false);
		}, 500);

		const poll = () => {
			if (!elementIsEditable(document.activeElement) && !timedOut) {
				setTimeout(() => {
					poll();
				}, 20);
			} else {
				clearTimeout(timeout);
				resolve(true);
			}
		};

		poll();
	});
}

/**
 * Try to bring the focus on an editable element. We first click it (as long as
 * the element is not a link) so that the caret is placed within it or an
 * editable element might appear.
 */
export async function tryToFocusOnEditable(wrapper: ElementWrapper) {
	if (wrapper.element instanceof HTMLAnchorElement) {
		await notify(
			`The element with hint "${wrapper.hint!.string!}" is not editable`,
			{ type: "error" }
		);
		return false;
	}

	wrapper.click();

	// We need to add a sleep here so that the focus has had time to move to the
	// clicked element. If we call waitActiveElementIsEditable too early we might
	// get the previously focused element.
	await sleep(50);

	return waitActiveElementIsEditable();
}
