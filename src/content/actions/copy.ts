import { HintedIntersector } from "../../typings/Intersector";
import { showTooltip } from "../hints/showTooltip";

export function copyElementTextContentToClipboard(
	intersectors: HintedIntersector[]
): string | undefined {
	const textContents = [];
	for (const intersector of intersectors) {
		const textContent = intersector.element.textContent;
		textContents.push(textContent);
		const message = textContent ? "Copied!" : "No text content to copy";
		showTooltip(intersector, message, 1500);
	}

	return textContents.length > 0 ? textContents.join("\n") : undefined;
}

export function copyLinkToClipboard(
	intersectors: HintedIntersector[]
): string | undefined {
	const hrefs = [];

	for (const intersector of intersectors) {
		let href;
		if (intersector.element instanceof HTMLAnchorElement) {
			href = intersector.element.href;
			hrefs.push(href);
		}

		const message = href ? "Copied!" : "Not a link";
		showTooltip(intersector, message, 1500);
	}

	return hrefs.length > 0 ? hrefs.join("\n") : undefined;
}

export function copyMarkdownLinkToClipboard(
	intersectors: HintedIntersector[]
): string | undefined {
	const markdownLinks = [];

	for (const intersector of intersectors) {
		let href;
		let markdownLink;
		if (intersector.element instanceof HTMLAnchorElement) {
			href = intersector.element.href;
			const title = intersector.element.textContent ?? "";
			markdownLink = `[${title}](${href})`;
			markdownLinks.push(markdownLink);
		}

		const message = markdownLink ? "Copied!" : "Not a link";
		showTooltip(intersector, message, 1500);
	}

	return markdownLinks.length > 0 ? markdownLinks.join("\n") : undefined;
}
