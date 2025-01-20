import browser from "webextension-polyfill";
import type { MessageData, MessageReturn } from "../../typings/ProtocolMap";
import { getRequiredCurrentTabId } from "../tabs/getCurrentTab";
import { getAllFrames } from "../utils/getAllFrames";
import { promiseAllSettledGrouped } from "../utils/promises";
import type { HasRequiredData, MessageWithoutTarget } from "./messaging.types";

/**
 * Send a message to all frames of the tab.
 *
 * @returns An object in the shape `{ results, resultsWithFrameId }`.
 */
export async function sendMessageToAllFrames<K extends MessageWithoutTarget>(
	messageId: K,
	...args: HasRequiredData<K> extends true
		? [data: MessageData<K>, tabId?: number]
		: [data?: MessageData<K>, tabId?: number]
) {
	const [data, tabId] = args;
	const tabId_ = tabId ?? (await getRequiredCurrentTabId());

	const frames = await getAllFrames(tabId_);

	const sending = frames.map(async ({ frameId }) => {
		return (
			browser.tabs.sendMessage(
				tabId_,
				{ messageId, data },
				{ frameId }
			) as Promise<MessageReturn<K>>
		).then((result) => ({
			frameId,
			result,
		}));
	});

	const { results: resultsWithFrameId, rejected } =
		await promiseAllSettledGrouped(sending);

	for (const { reason } of rejected) {
		// Even if there is a content script running in the main frame, sending
		// messages to child frames might be unsuccessful. For example, the URL of a
		// frame might be `about:blank`, where content scripts are not allowed. We
		// are not worried about those errors, so we ignore them.
		if (
			reason.message !==
			"Could not establish connection. Receiving end does not exist."
		) {
			// In most cases we don't care about errors when sending messages to all
			// frames, but if we don't log them here they get silently swallowed.
			console.error("Content Script Error:", reason.message);
		}
	}

	return {
		results: resultsWithFrameId.map((result) => result.result),
		resultsWithFrameId,
	};
}
