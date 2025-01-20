import { type SimplifyDeep } from "type-fest";
import browser, { type Runtime, type Tabs } from "webextension-polyfill";
import { getBestFuzzyMatch } from "../../common/getBestFuzzyMatch";
import { isValidMessage } from "../../common/messaging/isValidMessage";
import {
	getTargetFromFuzzyTexts,
	getTargetMarkType,
	getTargetValues,
	getViewportOnlyValue,
} from "../../common/target/targetConversion";
import {
	type BackgroundBoundMessageMap,
	type ContentBoundMessageMap,
	type MessageData,
	type MessageReturn,
} from "../../typings/ProtocolMap";
import {
	type ElementHintMark,
	type ElementMark,
	type ElementReferenceMark,
	type FuzzyTextElementMark,
	type Target,
} from "../../typings/Target/Target";
import { getRequiredCurrentTabId } from "../tabs/getCurrentTab";
import { splitElementHintTargetByFrame } from "../target/splitElementHintTargetByFrame";
import { splitElementReferenceTargetByFrame } from "../target/splitElementReferenceTargetByFrame";
import { mapMapValues } from "../target/utils";
import { getAllFrames } from "../utils/getAllFrames";
import { promiseAllSettledGrouped } from "../utils/promises";
import { pingContentScript } from "./pingContentScript";
import { sendMessage } from "./sendMessage";

type Sender = { tab: Tabs.Tab; tabId: number; frameId: number };

type OnMessageCallback<K extends keyof BackgroundBoundMessageMap> =
	SimplifyDeep<
		(
			data: MessageData<K>,
			sender: Sender
		) => MessageReturn<K> | Promise<MessageReturn<K>>
	>;

const messageHandlers = new Map<keyof BackgroundBoundMessageMap, unknown>();

export function onMessage<K extends keyof BackgroundBoundMessageMap>(
	messageId: K,
	callback: OnMessageCallback<K>
) {
	if (messageHandlers.has(messageId)) {
		throw new Error("There can only be one message handler per messageId");
	}

	messageHandlers.set(messageId, callback);
}

export async function handleIncomingMessage<
	K extends keyof BackgroundBoundMessageMap,
>(message: unknown, sender: Runtime.MessageSender) {
	if (!isValidMessage(message)) {
		console.log(message);
		throw new Error("Invalid message coming from content script.");
	}

	const { messageId, data } = message as {
		messageId: K;
		data: MessageData<K>;
	};

	const handler = messageHandlers.get(messageId) as OnMessageCallback<K>;
	if (!handler) {
		throw new Error(`No handler was register for the messageId "${messageId}"`);
	}

	// This function handles messages coming from the content script. We know that
	// tab and the frameId are defined.
	return handler(data, {
		tab: sender.tab!,
		tabId: sender.tab!.id!,
		frameId: sender.frameId!,
	});
}

type MessageWithTarget = {
	[K in keyof ContentBoundMessageMap]: MessageData<K> extends {
		target: Target<ElementMark>;
	}
		? K
		: never;
}[keyof ContentBoundMessageMap];

/**
 * Send a message to the frames who own the hints in `target`. It will group the
 * targets by their `frameId`. It will then send a message to each frame and
 * return an object in the shape `{ results, values }`. The `results` property
 * is an array of objects with the shape `{ frameId, value }`. The `values`
 * property is just the values within `results` unwrapped. They are provided
 * like this for better ergonomics.
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

async function splitTargetByFrame(
	tabId: number,
	target: Target<ElementMark>
): Promise<Map<number, Target<ElementMark>>> {
	const type = getTargetMarkType(target);

	switch (type) {
		case "elementHint": {
			return splitElementHintTargetByFrame(
				tabId,
				target as Target<ElementHintMark>
			);
		}

		case "elementReference": {
			return splitElementReferenceTargetByFrame(
				tabId,
				target as Target<ElementReferenceMark>
			);
		}

		case "fuzzyText": {
			return splitFuzzyTextTargetByFrame(
				tabId,
				target as Target<FuzzyTextElementMark>
			);
		}
	}
}

async function splitFuzzyTextTargetByFrame(
	tabId: number,
	target: Target<FuzzyTextElementMark>
) {
	const thresholdExcellent = 0.1;

	const texts = getTargetValues(target);
	const viewportOnly = getViewportOnlyValue(target);

	const textsPromise = texts.map(async (text) => {
		// Main Frame: Most of the time we will find the searched element in the
		// main frame. At the same time we need to avoid finding one element with a
		// bad score when there might be an element with a better score in another
		// frame. So if the match is not excellent we will send the message to all
		// frames with a timeout to prevent the slow frames from making the command
		// too slow.
		const mainFrameResult = await sendMessage("matchElementByText", {
			text,
			viewportOnly,
		});
		const mainFrameMatch = { frameId: 0, text, match: mainFrameResult };

		// If we have an excellent hintable match in the main frame (score < 0.1),
		// use it immediately
		if (
			mainFrameResult &&
			mainFrameResult.score < thresholdExcellent &&
			mainFrameResult.isHintable
		) {
			return [mainFrameMatch];
		}

		// If no excellent hintable match in the main frame, send the message to
		// all frames with a time out to prevent the slow frames from making the
		// command too slow.
		const frames = await getAllFrames(tabId);

		const framesPromise = frames
			.filter(({ frameId }) => frameId !== 0)
			.map(async ({ frameId }) => {
				return sendMessage(
					"matchElementByText",
					{
						text,
						viewportOnly,
					},
					{ frameId, maxWait: 300 }
				).then((match) => ({
					frameId,
					text,
					match,
				}));
			});

		const { results } = await promiseAllSettledGrouped(framesPromise);
		return [mainFrameMatch, ...results];
	});

	const { results } = await promiseAllSettledGrouped(textsPromise);
	const allResults = results.flat();

	type FrameMatch = {
		frameId: number;
		text: string;
		match: { score: number; isHintable: boolean };
	};

	// Build an array of the best result for each text. Normally, there will only
	// be one text, but it is possible that there are more if the user says a
	// command like `click text foo and text bar`.
	const bestResults = texts.map((text) => {
		const textResults = allResults
			.filter((r): r is FrameMatch => Boolean(r.match))
			.filter((r) => r.text === text);

		const bestResult = getBestFuzzyMatch(textResults);

		if (!bestResult) {
			throw new Error(`No matching element found for text: "${text}"`);
		}

		return bestResult;
	});

	const fuzzyTextsByFrame = new Map<number, string[]>();
	for (const { frameId, text } of bestResults) {
		fuzzyTextsByFrame.set(frameId, [
			...(fuzzyTextsByFrame.get(frameId) ?? []),
			text,
		]);
	}

	return mapMapValues(fuzzyTextsByFrame, getTargetFromFuzzyTexts);
}
