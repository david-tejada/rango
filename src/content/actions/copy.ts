import { Hintable } from "../Hintable";
import { showTooltip } from "../hints/showTooltip";

export function copyElementTextContentToClipboard(
	hintables: Hintable[]
): string | undefined {
	const textContents = [];
	for (const hintable of hintables) {
		const textContent = hintable.element.textContent;
		textContents.push(textContent);
		const message = textContent ? "Copied!" : "No text content to copy";
		showTooltip(hintable, message, 1500);
	}

	return textContents.length > 0 ? textContents.join("\n") : undefined;
}

export function copyLinkToClipboard(hintables: Hintable[]): string | undefined {
	const hrefs = [];

	for (const hintable of hintables) {
		let href;
		if (hintable.element instanceof HTMLAnchorElement) {
			href = hintable.element.href;
			hrefs.push(href);
		}

		const message = href ? "Copied!" : "Not a link";
		showTooltip(hintable, message, 1500);
	}

	return hrefs.length > 0 ? hrefs.join("\n") : undefined;
}

export function copyMarkdownLinkToClipboard(
	hintables: Hintable[]
): string | undefined {
	const markdownLinks = [];

	for (const hintable of hintables) {
		let href;
		let markdownLink;
		if (hintable.element instanceof HTMLAnchorElement) {
			href = hintable.element.href;
			const title = hintable.element.textContent ?? "";
			markdownLink = `[${title}](${href})`;
			markdownLinks.push(markdownLink);
		}

		const message = markdownLink ? "Copied!" : "Not a link";
		showTooltip(hintable, message, 1500);
	}

	return markdownLinks.length > 0 ? markdownLinks.join("\n") : undefined;
}
