import Fuse from "fuse.js";
import { ElementWrapper } from "../../typings/ElementWrapper";
import { notify } from "../notify/notify";
import { getCachedSetting } from "../settings/cacheSettings";
import { getToggles } from "../settings/toggles";
import { getAllWrappers } from "../wrappers/wrappers";
import { RangoActionWithTargets } from "../../typings/RangoAction";
import { runRangoActionWithTarget } from "./runRangoActionWithTarget";

let textMatchedWrapper: ElementWrapper | undefined;

export async function matchElementByText(
	text: string,
	prioritizeViewport: boolean
) {
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
		if (prioritizeViewport) {
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
		}

		return a.score! - b.score!;
	});

	const bestMatch = sortedMatches[0];
	textMatchedWrapper = bestMatch?.item.wrapper;

	return bestMatch?.score;
}

export async function executeActionOnTextMatchedElement(
	actionType: RangoActionWithTargets["type"]
) {
	if (textMatchedWrapper) {
		await runRangoActionWithTarget({ type: actionType, target: [] }, [
			textMatchedWrapper,
		]);
	}
}
