import { getActiveElement, isEditable } from "../dom/utils";
import { type ElementWrapper } from "../wrappers/ElementWrapper";
import { getWrapperForElement } from "../wrappers/wrappers";

async function waitActiveEditable(): Promise<Element | undefined | null> {
	return new Promise((resolve) => {
		let timedOut = false;

		const timeout = setTimeout(() => {
			timedOut = true;
			resolve(undefined);
		}, 500);

		const poll = () => {
			const activeElement = getActiveElement();
			if (!isEditable(activeElement) && !timedOut) {
				setTimeout(() => {
					poll();
				}, 20);
			} else {
				clearTimeout(timeout);
				resolve(activeElement);
			}
		};

		poll();
	});
}

/**
 * Try to bring the focus on an editable element. We first click it (as long as
 * the element is not a link) so that the caret is placed within it or an
 * editable element might appear.
 *
 * @returns The `ElementWrapper` for the editable active element or `undefined` if
 * there is none.
 */
export async function activateEditable(wrapper: ElementWrapper) {
	if (wrapper.element instanceof HTMLAnchorElement) {
		throw new TypeError(
			`The element with hint "${wrapper.hint!.label!}" is not editable`
		);
	}

	await wrapper.click();

	// We need to wait here so that the focus has had time to move to the clicked
	// element. If we call waitActiveElementIsEditable too early we might get the
	// previously focused element.
	await new Promise((resolve) => {
		setTimeout(resolve, 50);
	});

	const activeEditable = await waitActiveEditable();
	if (!activeEditable) return undefined;

	// If we have nested contenteditable elements (e.g. Notion) the active element
	// will always be the topmost. In that case we have to return the wrapper this
	// function was called with.
	if (
		wrapper.element instanceof HTMLElement &&
		wrapper.element.isContentEditable
	) {
		return wrapper;
	}

	return getWrapperForElement(activeEditable);
}
