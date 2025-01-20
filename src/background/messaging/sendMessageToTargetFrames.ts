import browser from "webextension-polyfill";
import type {
	ContentBoundMessageMap,
	MessageData,
	MessageReturn,
} from "../../typings/ProtocolMap";
import { type ElementMark, type Target } from "../../typings/Target/Target";
import { getRequiredCurrentTabId } from "../tabs/getCurrentTab";
import { splitTargetByFrame } from "../target/splitTargetByFrame";
import { pingContentScript } from "./pingContentScript";

type MessageWithTarget = {
	[K in keyof ContentBoundMessageMap]: MessageData<K> extends {
		target: Target<ElementMark>;
	}
		? K
		: never;
}[keyof ContentBoundMessageMap];

/**
 * Send a message to the frames who own the hints in `target`. It will group the
 * targets by their `frameId`.
 *
 * @returns An object with the shape `{ results, resultsWithFrameId }`.
 *
 */
export async function sendMessageToTargetFrames<K extends MessageWithTarget>(
	messageId: K,
	data: NonNullable<MessageData<K>>,
	tabId?: number
) {
	const destinationTabId = tabId ?? (await getRequiredCurrentTabId());
	await pingContentScript(destinationTabId);

	const targetByFrameMap = await splitTargetByFrame(
		destinationTabId,
		data.target
	);

	const sending = [...targetByFrameMap].map(async ([frameId, frameTarget]) => {
		const frameData = { ...data, target: frameTarget };
		return (
			browser.tabs.sendMessage(
				destinationTabId,
				{ messageId, data: frameData },
				{ frameId }
			) as Promise<MessageReturn<K>>
		).then((result) => ({
			frameId,
			result,
		}));
	});

	const resultsWithFrameId = await Promise.all(sending);

	return {
		results: resultsWithFrameId.map((result) => result.result),
		resultsWithFrameId,
	};
}
