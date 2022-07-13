import browser from "webextension-polyfill";
import { ScriptResponse } from "../../typings/ScriptResponse";
import { ContentRequest } from "../../typings/ContentRequest";
import { getCurrentTabId } from "../utils/getCurrentTab";
import { splitRequestsByFrame } from "../utils/splitRequestsByFrame";

export async function sendRequestToCurrentTab(
	request: ContentRequest
): Promise<ScriptResponse | undefined> {
	const currentTabId = await getCurrentTabId();

	if ("target" in request) {
		const frameIds = await splitRequestsByFrame(currentTabId, request);

		if (frameIds) {
			const sending = Array.from(frameIds).map(async ([frameId, rangoAction]) =>
				browser.tabs.sendMessage(currentTabId, rangoAction, { frameId })
			);

			const settledPromises = await Promise.allSettled(sending);

			// If it is a copy command we have to take into account that the elements
			// could be in different frames
			if (request.type.startsWith("copy")) {
				const texts = settledPromises
					.filter((promise) => promise.status === "fulfilled")
					.map((promise) => {
						return ((promise.status === "fulfilled" &&
							promise.value.talonAction.textToCopy) ??
							"") as string;
					});

				return {
					talonAction: {
						type: "copyToClipboard",
						textToCopy: texts.join("\n"),
					},
				};
			}

			if (settledPromises.length === 1) {
				const uniquePromiseResult = settledPromises[0];
				if (uniquePromiseResult && "value" in uniquePromiseResult) {
					const response = uniquePromiseResult.value as ScriptResponse;
					return response;
				}
			}
		}
	}

	return undefined;
}
