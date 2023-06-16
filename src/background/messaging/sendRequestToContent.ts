import browser from "webextension-polyfill";
import { RequestFromBackground } from "../../typings/RequestFromBackground";
import { TalonAction } from "../../typings/RequestFromTalon";
import { isPromiseFulfilledResult } from "../../typings/TypingUtils";
import { getCurrentTabId } from "../utils/getCurrentTab";
import { splitRequestsByFrame } from "../utils/splitRequestsByFrame";

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
	"handleCustomSelectorsChange",
]);

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
		const frameIds = await splitRequestsByFrame(targetTabId, request);

		// We don't need to worry about the number of hints said, if it was more
		// than one the action would have changed to "clickElement"
		if (request.type === "directClickElement" && frameIds?.size === 0) {
			return [{ name: "typeTargetCharacters" }];
		}

		if (frameIds) {
			const sending = Array.from(frameIds).map(
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
	}

	frameId = frameId ?? toAllFrames.has(request.type) ? undefined : 0;
	request.frameId = frameId;

	return browser.tabs.sendMessage(targetTabId, request, {
		frameId,
	});
}
