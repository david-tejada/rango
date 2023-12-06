import { ElementWrapper } from "../../typings/ElementWrapper";
import { hasPropertyValue } from "../../typings/TypingUtils";
import { showTooltip } from "../hints/showTooltip";

export function copyElementTextContentToClipboard(
	wrappers: ElementWrapper[]
): string | undefined {
	const textContents: string[] = [];

	for (const wrapper of wrappers) {
		const textContent = hasPropertyValue(wrapper.element)
			? wrapper.element.value
			: wrapper.element.textContent;

		if (textContent) {
			textContents.push(textContent);
			showTooltip(wrapper, "Copied!", 1500);
		} else {
			showTooltip(wrapper, "No text content to copy", 1500);
		}
	}

	return textContents.length > 0 ? textContents.join("\n") : undefined;
}

export function copyLinkToClipboard(
	wrappers: ElementWrapper[]
): string | undefined {
	const hrefs: string[] = [];

	for (const wrapper of wrappers) {
		let href;

		if (wrapper.element instanceof HTMLAnchorElement) {
			href = wrapper.element.href;
			hrefs.push(href);
			showTooltip(wrapper, "Copied!", 1500);
		} else {
			showTooltip(wrapper, "Not a link", 1500);
		}
	}

	return hrefs.length > 0 ? hrefs.join("\n") : undefined;
}

export function copyMarkdownLinkToClipboard(
	wrappers: ElementWrapper[]
): string | undefined {
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

	return markdownLinks.length > 0 ? markdownLinks.join("\n") : undefined;
}
