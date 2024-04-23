import Fuse from "fuse.js";
import { ElementWrapper } from "../../typings/ElementWrapper";
import { TalonAction } from "../../typings/RequestFromTalon";
import { notify } from "../notify/notify";
import { getCachedSetting } from "../settings/cacheSettings";
import { getToggles } from "../settings/toggles";
import { getAllWrappers } from "../wrappers/wrappers";
import { openInBackgroundTab } from "./openInNewTab";

export async function clickElement(
	wrappers: ElementWrapper[]
): Promise<TalonAction[] | undefined> {
	let performPageFocus = false;
	// If there are multiple targets and some of them are anchor elements we open
	// those in a new background tab
	if (wrappers.length > 1) {
		const anchorWrappers = wrappers.filter(
			(hintable) => hintable.element instanceof HTMLAnchorElement
		);
		wrappers = wrappers.filter(
			(hintable) => !(hintable.element instanceof HTMLAnchorElement)
		);
		await openInBackgroundTab(anchorWrappers);
	}

	for (const wrapper of wrappers) {
		const shouldFocusPage = wrapper.click();
		if (shouldFocusPage) performPageFocus = true;
	}

	if (
		wrappers.length === 1 &&
		wrappers[0]!.element instanceof HTMLSelectElement
	) {
		return [
			{ name: "focusPage" },
			{
				name: "key",
				key: "alt-down",
				main: true,
			},
		];
	}

	if (performPageFocus) {
		return [{ name: "focusPage" }];
	}

	return undefined;
}

let textMatchedWrapper: ElementWrapper | undefined;

export async function matchElementByText(text: string) {
	if (!getToggles().computed && !getCachedSetting("alwaysComputeHintables")) {
		await notify(
			'Enable the setting "Always compute hintable elements" if you want this command to work while the hints are off.',
			{ type: "warning" }
		);
		return;
	}

	const hintablesWithTextContent = getAllWrappers()
		.filter((w) => w.isHintable)
		.map((wrapper) => ({
			wrapper,
			textContent: wrapper.element.textContent?.trim(),
		}));

	const fuse = new Fuse(hintablesWithTextContent, {
		keys: ["textContent"],
		ignoreLocation: true,
		includeScore: true,
		threshold: 0.3,
	});

	const sortedMatches = fuse.search(text).sort((a, b) => {
		if (
			a.item.wrapper.isIntersectingViewport &&
			!b.item.wrapper.isIntersectingViewport
		) {
			return -1;
		}

		if (
			!a.item.wrapper.isIntersectingViewport &&
			b.item.wrapper.isIntersectingViewport
		) {
			return 1;
		}

		return a.score! - b.score!;
	});

	const bestMatch = sortedMatches[0];
	textMatchedWrapper = bestMatch?.item.wrapper;

	return bestMatch?.score;
}

export function clickTextMatchedElement() {
	textMatchedWrapper?.click();
}
