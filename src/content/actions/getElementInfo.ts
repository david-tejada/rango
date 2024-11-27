import { showTooltip } from "../feedback/tooltip/showTooltip";
import { type ElementWrapper } from "../wrappers/ElementWrapper";

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

export async function getAnchorHref(
	wrappers: ElementWrapper[],
	copyTooltip = false
) {
	if (copyTooltip) {
		for (const wrapper of wrappers) {
			if (wrapper.element instanceof HTMLAnchorElement) {
				showTooltip(wrapper, "Copied!", 1500);
			} else {
				showTooltip(wrapper, "Not a link", 1500);
			}
		}
	}

	return wrappers
		.map((wrapper) => wrapper.element)
		.filter((element) => element instanceof HTMLAnchorElement)
		.map((element) => element.href);
}
