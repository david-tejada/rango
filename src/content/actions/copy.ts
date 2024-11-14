import { type ElementWrapper } from "../../typings/ElementWrapper";
import { showTooltip } from "../hints/showTooltip";

export function getElementTextContent(wrappers: ElementWrapper[]) {
	const textContents: string[] = [];

	for (const wrapper of wrappers) {
		const textContent =
			"value" in wrapper.element
				? typeof wrapper.element.value === "string"
					? wrapper.element.value
					: undefined
				: wrapper.element.textContent;

		if (textContent) {
			textContents.push(textContent);
			showTooltip(wrapper, "Copied!", 1500);
		} else {
			showTooltip(wrapper, "No text content to copy", 1500);
		}
	}

	return textContents;
}

export function getMarkdownLink(wrappers: ElementWrapper[]) {
	const markdownLinks: string[] = [];

	for (const wrapper of wrappers) {
		let href;
		let markdownLink;

		if (wrapper.element instanceof HTMLAnchorElement) {
			href = wrapper.element.href;
			const title = wrapper.element.textContent ?? "";
			markdownLink = `[${title}](${href})`;
			markdownLinks.push(markdownLink);
		}

		const message = markdownLink ? "Copied!" : "Not a link";
		showTooltip(wrapper, message, 1500);
	}

	return markdownLinks;
}
