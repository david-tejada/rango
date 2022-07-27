import { isFocusOnClickInput } from "../../typings/TypingUtils";

function isDisabled(element: Element) {
	return (
		(element instanceof HTMLInputElement ||
			element instanceof HTMLTextAreaElement ||
			element instanceof HTMLOptionElement ||
			element instanceof HTMLButtonElement ||
			element instanceof HTMLSelectElement) &&
		element.disabled
	);
}

const clickableTags = new Set([
	"button",
	"a",
	"input",
	"summary",
	"textarea",
	"select",
	"option",
	"label",
]);

const clickableRoles = new Set([
	"button",
	"link",
	"treeitem",
	"tab",
	"option",
	"radio",
	"checkbox",
	"menuitem",
	"menuitemradio",
]);

// We could just return a boolean but I want to have the clickable type for debugging purposes
export function isClickable(element: Element): boolean {
	const className = element.className;
	const elementTag = element.tagName;
	const elementRole = element.getAttribute("role");
	// Ignoring some items that even though they have onclick event they don't do anything
	// or are redundant
	// if (
	// 	// SLACK
	// 	(location.host === "app.slack.com" &&
	// 		(className ===
	// 			"p-channel_sidebar__static_list__item p-channel_sidebar__static_list__item--contain c-virtual_list__item" || // Does nothing
	// 			elementRole === "toolbar")) || // Duplicate
	// 	(elementTag === "DIV" &&
	// 		(element as HTMLElement).dataset["sk"] === "tooltip_parent") || // Duplicate
	// 	// YOUTUBE
	// 	(location.host === "www.youtube.com" &&
	// 		className ===
	// 			"yt-simple-endpoint style-scope ytd-toggle-button-renderer") || // Duplicate
	// 	className === "style-scope ytd-guide-entry-renderer" ||
	// 	className === "yt-simple-endpoint style-scope ytd-button-renderer" // Duplicate
	// ) {
	// 	return false;
	// }

	// Don't show hints if the element is disabled
	if (element.disabled) {
		return false;
	}

	if (
		element instanceof HTMLLabelElement &&
		element.control &&
		isDisabled(element.control)
	) {
		return false;
	}

	if (clickableTags.has(elementTag.toLowerCase())) {
		return true;
	}

	if (elementRole && clickableRoles.has(elementRole.toLowerCase())) {
		let isRedundant = false;
		for (const child of element.children) {
			if (clickableTags.has(child.tagName)) {
				isRedundant = true;
			}
		}

		if (!isRedundant) {
			return true;
		}
	}

	if (element.getAttribute("contenteditable") === "true") {
		return true;
	}

	if ((element as HTMLElement).onclick !== null) {
		return true;
	}

	return false;
}

export function focusesOnclick(element: Element): boolean {
	if (isFocusOnClickInput(element)) {
		return true;
	}

	if (
		element instanceof HTMLTextAreaElement ||
		element instanceof HTMLSelectElement
	) {
		return true;
	}

	if (element.getAttribute("contenteditable") === "true") {
		return true;
	}

	return false;
}
