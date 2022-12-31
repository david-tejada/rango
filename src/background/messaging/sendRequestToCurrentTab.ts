import browser from "webextension-polyfill";
import { ContentRequest } from "../../typings/ContentRequest";
import { TalonAction } from "../../typings/RequestFromTalon";
import { isPromiseFulfilledResult } from "../../typings/TypingUtils";
import { getCurrentTabId } from "../utils/getCurrentTab";
import { splitRequestsByFrame } from "../utils/splitRequestsByFrame";

let lastScrollFrameId = 0;

export async function sendRequestToCurrentTab(
	request: ContentRequest
): Promise<unknown> {
	const currentTabId = await getCurrentTabId();

	if ("target" in request) {
		// We need to take into account that the targets could be in different frames
		const frameIds = await splitRequestsByFrame(currentTabId, request);

		if (request.type === "directClickElement" && frameIds?.size === 0) {
			return { type: "noHintFound" };
		}

		if (frameIds) {
			const sending = Array.from(frameIds).map(
				async ([frameId, rangoAction]) => {
					if (/^scroll.*AtElement$/.test(request.type)) {
						lastScrollFrameId = frameId;
					}

					return browser.tabs.sendMessage(currentTabId, rangoAction, {
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
		return browser.tabs.sendMessage(currentTabId, request, {
			frameId: lastScrollFrameId,
		});
	}

	if (request.type === "refreshHints") {
		// We need to send the request to all frames
		return browser.tabs.sendMessage(currentTabId, request);
	}

	return browser.tabs.sendMessage(currentTabId, request, {
		frameId: 0,
	});
}
