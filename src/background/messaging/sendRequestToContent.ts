import browser from "webextension-polyfill";
import { RequestFromBackground } from "../../typings/RequestFromBackground";
import { TalonAction } from "../../typings/RequestFromTalon";
import { isPromiseFulfilledResult } from "../../typings/TypingUtils";
import { getCurrentTabId } from "../utils/getCurrentTab";
import { splitRequestsByFrame } from "../utils/splitRequestsByFrame";
import {
	RangoActionRemoveReference,
	RangoActionRunActionOnReference,
	RangoActionWithTargets,
} from "../../typings/RangoAction";
import { notify } from "../utils/notify";

let lastScrollFrameId = 0;

const toAllFrames = new Set([
	"markHintsAsKeyboardReachable",
	"restoreKeyboardReachableHints",
	"displayExtraHints",
	"displayExcludedHints",
	"displayLessHints",
	"confirmSelectorsCustomization",
	"includeOrExcludeMoreSelectors",
	"includeOrExcludeLessSelectors",
	"resetCustomSelectors",
	"showReferences",
	"removeReference",
	"runActionOnReference",
]);

async function handleActionOnReference(
	request: RangoActionRemoveReference | RangoActionRunActionOnReference,
	tabId: number
) {
	const allFrames = await browser.webNavigation.getAllFrames({
		tabId,
	});

	const sending = allFrames.map(async (frame) =>
		browser.tabs.sendMessage(tabId, request, {
			frameId: frame.frameId,
		})
	);

	const results = await Promise.allSettled(sending);
	const found = results
		.filter(isPromiseFulfilledResult)
		.some((result) => result.value);

	const reference =
		request.type === "removeReference" ? request.arg : request.arg2;

	if (!found) {
		await notify(`Unable to find reference "${reference}".`, {
			type: "warning",
		});
	}

	if (found && request.type === "removeReference") {
		await notify(`Reference "${reference}" removed.`, { icon: "trash" });
	}
}

async function runActionOnTextMatchedElement(
	actionType: RangoActionWithTargets["type"],
	text: string,
	prioritizeViewport: boolean
) {
	const tabId = await getCurrentTabId();
	const allFrames = await browser.webNavigation.getAllFrames({
		tabId,
	});

	const bestScoreByFramePromise = allFrames.map(async (frame) => ({
		frameId: frame.frameId,
		score: (await browser.tabs.sendMessage(
			tabId,
			{ type: "matchElementByText", text, prioritizeViewport },
			{
				frameId: frame.frameId,
			}
		)) as number | undefined,
	}));

	const results = await Promise.allSettled(bestScoreByFramePromise);
	const matches = results
		.filter(isPromiseFulfilledResult)
		.map((result) => result.value)
		.filter((value) => typeof value.score === "number");

	const sorted = matches.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));

	if (sorted[0]) {
		await browser.tabs.sendMessage(
			tabId,
			{
				type: "executeActionOnTextMatchedElement",
				actionType,
			},
			{
				frameId: sorted[0].frameId,
			}
		);
	} else {
		await notify("Unable to find element with matching text", {
			type: "warning",
		});
	}
}

// Sends a request to the content script. If tabId is not specified it will
// send it to the current tab. If frameId is not specified it will send it to
// the main frame (frameId 0).
export async function sendRequestToContent(
	request: RequestFromBackground,
	tabId?: number,
	frameId?: number
): Promise<unknown> {
	const targetTabId = tabId ?? (await getCurrentTabId());

	if ("target" in request) {
		// We need to take into account that the targets could be in different frames
		const requestsByFrame = await splitRequestsByFrame(targetTabId, request);

		if (
			request.type === "directClickElement" &&
			request.target.length === 1 &&
			requestsByFrame?.size === 0
		) {
			return [{ name: "typeTargetCharacters" }];
		}

		if (requestsByFrame) {
			const sending = Array.from(requestsByFrame).map(
				async ([frameId, rangoAction]) => {
					if (/^scroll.*AtElement$/.test(request.type)) {
						lastScrollFrameId = frameId;
					}

					return browser.tabs.sendMessage(targetTabId, rangoAction, {
						frameId,
					});
				}
			);

			const results = await Promise.allSettled(sending);

			// If it is a copy command we need to join the results of different frames
			if (request.type.startsWith("copy")) {
				const texts = results
					.filter(isPromiseFulfilledResult)
					.filter((result) => result.value)
					.map((result) => {
						return result.value as string;
					});

				return texts.join("\n");
			}

			if (
				// We only send the talon action if there was only one result. For
				// example, if the action was "directClickElement" with multiple targets
				// and those hints can't be found there is no use in sending back to
				// talon "noHintFound" to type those letters
				results.length === 1 &&
				isPromiseFulfilledResult(results[0]!) &&
				results[0]!.value
			) {
				return results[0].value as TalonAction;
			}

			return undefined;
		}
	} else if (/^scroll.*AtElement$/.test(request.type)) {
		// This is for the "up/down/left/right again" commands
		return browser.tabs.sendMessage(targetTabId, request, {
			frameId: lastScrollFrameId,
		});
	} else if (
		request.type === "removeReference" ||
		request.type === "runActionOnReference"
	) {
		return handleActionOnReference(request, targetTabId);
	} else if (request.type === "runActionOnTextMatchedElement") {
		return runActionOnTextMatchedElement(
			request.arg,
			request.arg2,
			request.arg3
		);
	}

	frameId = frameId ?? toAllFrames.has(request.type) ? undefined : 0;
	request.frameId = frameId;

	return browser.tabs.sendMessage(targetTabId, request, {
		frameId,
	});
}
