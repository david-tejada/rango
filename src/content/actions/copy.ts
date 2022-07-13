import { HintedIntersector } from "../../typings/Intersector";
import { ResponseWithTalonAction } from "../../typings/ScriptResponse";
import { showTooltip } from "../hints/showTooltip";

export function copyToClipboardResponse(text: string): ResponseWithTalonAction {
	return {
		talonAction: {
			type: "copyToClipboard",
			textToCopy: text,
		},
	};
}

export function copyElementTextContentToClipboard(
	intersectors: HintedIntersector[]
) {
	const textContents = [];
	for (const intersector of intersectors) {
		const textContent = intersector.element.textContent;
		textContents.push(textContent);
		const message = textContent ? "Copied!" : "No text content to copy";
		showTooltip(intersector, message, 1500);
	}

	return textContents.length > 1
		? copyToClipboardResponse(textContents.join("\n"))
		: undefined;
}

export function copyLinkToClipboard(intersectors: HintedIntersector[]) {
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

	return hrefs.length > 0
		? copyToClipboardResponse(hrefs.join("\n"))
		: undefined;
}

export function copyMarkdownLinkToClipboard(intersectors: HintedIntersector[]) {
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

	return markdownLinks.length > 0
		? copyToClipboardResponse(markdownLinks.join("\n"))
		: undefined;
}
