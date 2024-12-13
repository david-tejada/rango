import { type SimplifyDeep } from "type-fest";
import browser, { type Runtime, type Tabs } from "webextension-polyfill";
import { isValidMessage } from "../../common/messaging/isValidMessage";
import {
	getPrioritizeViewportValue,
	getTargetFromFuzzyTexts,
	getTargetFromLabels,
	getTargetFromReferences,
	getTargetMarkType,
	getTargetValues,
} from "../../common/target/targetConversion";
import { TargetError } from "../../common/target/TargetError";
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
import { getRequiredStack } from "../hints/labels/labelStack";
import { getCurrentTabId } from "../tabs/getCurrentTab";
import { assertReferencesInCurrentTab } from "../target/references";
import { getAllFrames } from "../utils/getAllFrames";
import { promiseAllSettledGrouped } from "../utils/promises";

type Destination = { tabId?: number; frameId?: number };
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

export class UnreachableContentScriptError extends Error {
	constructor(message = "Unable to communicate with content script.") {
		super(message);
		this.name = "UnreachableContentScriptError";
		this.message = message;
	}
}

async function pingContentScript(tabId: number) {
	try {
		const contentScriptReached = await browser.tabs.sendMessage(
			tabId,
			{ messageId: "pingContentScript" },
			{ frameId: 0 }
		);

		if (!contentScriptReached) throw new Error("No content script.");
	} catch {
		throw new UnreachableContentScriptError(
			`Unable to communicate with content script for tab with id ${tabId}.`
		);
	}
}

type MessageWithoutTarget = {
	[K in keyof ContentBoundMessageMap]: MessageData<K> extends {
		target: Target<ElementMark>;
	}
		? never
		: K;
}[keyof ContentBoundMessageMap];

type HasRequiredData<K extends MessageWithoutTarget> =
	MessageData<K> extends undefined ? false : true;

export async function sendMessage<K extends MessageWithoutTarget>(
	messageId: K,
	...args: HasRequiredData<K> extends true
		? [data: MessageData<K>, destination?: Destination]
		: [data?: MessageData<K>, destination?: Destination]
): Promise<MessageReturn<K>> {
	const [data, destination] = args;
	const tabId = destination?.tabId ?? (await getCurrentTabId());
	await pingContentScript(tabId);

	try {
		return await browser.tabs.sendMessage(
			tabId,
			{ messageId, data },
			{ frameId: destination?.frameId ?? 0 }
		);
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error("Content Script Error:", error.message);
		}

		throw error;
	}
}

/**
 * Send a message to the content script. If the content script is unreachable or
 * any other error occurs, this function will silently ignore the error and
 * return `undefined`.
 */
export async function sendMessageSafe<K extends MessageWithoutTarget>(
	messageId: K,
	...args: HasRequiredData<K> extends true
		? [data: MessageData<K>, destination?: Destination]
		: [data?: MessageData<K>, destination?: Destination]
) {
	try {
		return await sendMessage(messageId, ...args);
	} catch {
		// Silently ignore errors
		return undefined;
	}
}

/**
 * Send a message to all frames of the tab. It will return an object in the
 * shape `{ results, values }`. The `results` property is an array of objects
 * with the shape `{ frameId, value }`. The `values` property is just the
 * values within `results` unwrapped. They are provided like this for better
 * ergonomics. The results only include fulfilled results.
 */
export async function sendMessageToAllFrames<K extends MessageWithoutTarget>(
	messageId: K,
	...args: HasRequiredData<K> extends true
		? [data: MessageData<K>, tabId?: number]
		: [data?: MessageData<K>, tabId?: number]
) {
	const [data, tabId] = args;
	const tabId_ = tabId ?? (await getCurrentTabId());

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
	const destinationTabId = tabId ?? (await getCurrentTabId());
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

async function splitElementHintTargetByFrame(
	tabId: number,
	target: Target<ElementHintMark>
) {
	const hints = getTargetValues(target);
	const stack = await getRequiredStack(tabId);

	if (target.type === "range") {
		const anchorFrameId = stack.assigned.get(target.anchor.mark.value);
		if (anchorFrameId === undefined) {
			throw new TargetError(
				`Couldn't find mark "${target.anchor.mark.value}".`
			);
		}

		const activeFrameId = stack.assigned.get(target.active.mark.value);
		if (activeFrameId === undefined) {
			throw new TargetError(
				`Couldn't find mark "${target.active.mark.value}".`
			);
		}

		if (anchorFrameId !== activeFrameId) {
			throw new TargetError(
				`Marks "${target.anchor.mark.value}" and "${target.active.mark.value}" are in different frames.`
			);
		}

		return new Map([[anchorFrameId, target]]);
	}

	const hintsByFrame = new Map<number, string[]>();

	for (const hint of hints) {
		const frameId = stack.assigned.get(hint);
		if (frameId === undefined) {
			throw new TargetError(`Couldn't find mark "${hint}".`);
		}

		hintsByFrame.set(frameId, [...(hintsByFrame.get(frameId) ?? []), hint]);
	}

	return mapMapValues(hintsByFrame, getTargetFromLabels);
}

async function splitElementReferenceTargetByFrame(
	tabId: number,
	target: Target<ElementReferenceMark>
) {
	const referenceNames = getTargetValues(target);
	await assertReferencesInCurrentTab(referenceNames);

	const frames = await getAllFrames(tabId);

	// We use `Promise.any` to return the first frame that successfully asserts it
	// has an active reference. We do this so that we make sure we only perform an
	// action on a single element, in case the reference is active in multiple
	// frames. Having this here also allows us to throw an appropriate error if no
	// frame has an active reference for the reference name.
	const sending = referenceNames.map(async (referenceName) => {
		return Promise.any(
			frames.map(async ({ frameId }) => {
				return sendMessage(
					"assertActiveReferenceInFrame",
					{ referenceName },
					{ frameId }
				).then(() => ({
					frameId,
					referenceName,
				}));
			})
		);
	});

	const { results } = await promiseAllSettledGrouped(sending);

	if (results.length === 0) {
		throw new Error("Unable to find elements for selected references.");
	}

	const referencesByFrame = new Map<number, string[]>();
	for (const { frameId, referenceName } of results) {
		referencesByFrame.set(frameId, [
			...(referencesByFrame.get(frameId) ?? []),
			referenceName,
		]);
	}

	return mapMapValues(referencesByFrame, getTargetFromReferences);
}

async function splitFuzzyTextTargetByFrame(
	tabId: number,
	target: Target<FuzzyTextElementMark>
) {
	const texts = getTargetValues(target);
	const prioritizeViewport = getPrioritizeViewportValue(target);
	const frames = await getAllFrames(tabId);

	const textsPromise = texts.map(async (text) => {
		const framesPromise = frames.map(async ({ frameId }) => {
			return sendMessage(
				"matchElementByText",
				{
					text,
					prioritizeViewport,
				},
				{ frameId }
			).then((score) => ({
				frameId,
				text,
				score,
			}));
		});

		const { results } = await promiseAllSettledGrouped(framesPromise);
		return results;
	});

	const { results } = await promiseAllSettledGrouped(textsPromise);
	const allResults = results.flat();

	type ResultType = { frameId: number; text: string; score: number };

	// Build an array of the best result for each text
	const bestResults = texts.map((text) => {
		const textResults = allResults.filter(
			(r): r is ResultType => r.text === text && typeof r.score === "number"
		);

		if (textResults.length === 0) {
			throw new Error(`No matching element found for text: "${text}"`);
		}

		const minScore = Math.min(...textResults.map((r) => r.score));

		// Get all results with the minimum score
		const bestResults = textResults.filter((r) => r.score === minScore);

		// If there's only one best result, return it
		if (bestResults.length === 1) {
			return bestResults[0]!;
		}

		// If multiple results have the same score, prefer the main frame (frameId: 0)
		const mainFrameResult = bestResults.find((r) => r.frameId === 0);
		if (mainFrameResult) {
			return mainFrameResult;
		}

		// If no main frame result, return the first one
		return bestResults[0]!;
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

/**
 * Return a new `Map` with the same keys as the original but with its values
 * being the result of executing the callback on the original values.
 */
function mapMapValues<K, V, R>(
	map: Map<K, V>,
	callback: (value: V) => R
): Map<K, R> {
	return new Map(
		Array.from(map.entries(), ([key, value]) => [key, callback(value)])
	);
}
