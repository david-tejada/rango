import browser from "webextension-polyfill";
import { ContentRequest } from "../../typings/ContentRequest";
import { isPromiseFulfilledResult } from "../../typings/TypingUtils";
import { getCurrentTabId } from "../utils/getCurrentTab";
import { splitRequestsByFrame } from "../utils/splitRequestsByFrame";

export async function sendRequestToCurrentTab(
	request: ContentRequest
): Promise<unknown> {
	const currentTabId = await getCurrentTabId();

	if ("target" in request) {
		// We need to take into account that the targets could be in different frames
		const frameIds = await splitRequestsByFrame(currentTabId, request);

		if (frameIds) {
			const sending = Array.from(frameIds).map(async ([frameId, rangoAction]) =>
				browser.tabs.sendMessage(currentTabId, rangoAction, { frameId })
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

			return undefined;
		}
	}

	return browser.tabs.sendMessage(currentTabId, request, {
		frameId: 0,
	});
}
