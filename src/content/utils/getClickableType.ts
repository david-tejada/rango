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

// We could just return a boolean but I want to have the clickable type for debugging purposes
export function getClickableType(element: Element): string | undefined {
	// Ignoring some items that even though they have onclick event they don't do anything
	// or are redundant
	if (
		// SLACK
		(location.host === "app.slack.com" &&
			(element.className ===
				"p-channel_sidebar__static_list__item p-channel_sidebar__static_list__item--contain c-virtual_list__item" || // Does nothing
				element.getAttribute("role") === "toolbar")) || // Duplicate
		(element.tagName === "DIV" &&
			(element as HTMLElement).dataset["sk"] === "tooltip_parent") || // Duplicate
		// YOUTUBE
		(location.host === "www.youtube.com" &&
			element.className ===
				"yt-simple-endpoint style-scope ytd-toggle-button-renderer") || // Duplicate
		element.className === "style-scope ytd-guide-entry-renderer" ||
		element.className === "yt-simple-endpoint style-scope ytd-button-renderer" // Duplicate
	) {
		return undefined;
	}

	// Don't show hints if the element is disabled
	if (isDisabled(element)) {
		return "disabled";
	}

	if (
		element instanceof HTMLLabelElement &&
		element.control &&
		isDisabled(element.control)
	) {
		return "disabled";
	}

	const clickableTags = new Set([
		"BUTTON",
		"A",
		"INPUT",
		"SUMMARY",
		"TEXTAREA",
		"SELECT",
		"OPTION",
		"LABEL",
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
	const elementTag = element.tagName;
	const elementRole = element.getAttribute("role");

	if (clickableTags.has(elementTag)) {
		return elementTag.toLowerCase();
	}

	if (elementRole && clickableRoles.has(elementRole)) {
		let isRedundant = false;
		for (const child of element.children) {
			if (clickableTags.has(child.tagName)) {
				isRedundant = true;
			}
		}

		if (!isRedundant) {
			return elementRole;
		}
	}

	if (element.getAttribute("contenteditable") === "true") {
		return "contenteditable";
	}

	if ((element as HTMLElement).onclick !== null) {
		return "onclick";
	}

	if (element.hasAttribute("jsaction")) {
		return "jsaction";
	}

	if (
		window.getComputedStyle(element).cursor === "pointer" &&
		element.parentElement &&
		window.getComputedStyle(element.parentElement).cursor !== "pointer"
	) {
		return "cursor:pointer";
	}

	return undefined;
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
