import browser, { type Runtime, type Tabs } from "webextension-polyfill";
import { isValidMessage } from "../../common/messaging/isValidMessage";
import type {
	BackgroundBoundMessageMap,
	ContentBoundMessageMap,
	MessageData,
	MessageReturn,
} from "../../typings/ProtocolMap";
import { type ElementMark, type Target } from "../../typings/Target/Target";
import { getCurrentTabId } from "../utils/getCurrentTab";
import { splitTargetByFrame } from "../utils/splitTargetByFrame";

type Destination = { tabId?: number; frameId?: number };
type Sender = { tab: Tabs.Tab; tabId: number; frameId: number };

type OnMessageCallback<K extends keyof BackgroundBoundMessageMap> = (
	data: MessageData<K>,
	sender: Sender
) => MessageReturn<K> | Promise<MessageReturn<K>>;

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

export async function pingContentScript(tabId: number) {
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
	const currentTabId = await getCurrentTabId();
	const tabId = destination?.tabId ?? currentTabId;
	await pingContentScript(tabId);

	return browser.tabs.sendMessage(
		tabId,
		{ messageId, data },
		{ frameId: destination?.frameId ?? 0 }
	);
}

export async function sendMessageToAllFrames<K extends MessageWithoutTarget>(
	messageId: K,
	...args: HasRequiredData<K> extends true
		? [data: MessageData<K>, tabId?: number]
		: [data?: MessageData<K>, tabId?: number]
) {
	const [data, tabId] = args;
	const destinationTabId = tabId ?? (await getCurrentTabId());
	await pingContentScript(destinationTabId);
	const frames = await browser.webNavigation.getAllFrames({
		tabId: destinationTabId,
	});

	if (!frames) {
		throw new Error(
			`Error finding frames for tab with id "${destinationTabId}".`
		);
	}

	const frameIds = frames.map((frame) => frame.frameId);

	const sending = frameIds.map(async (frameId) => {
		return (
			browser.tabs.sendMessage(
				destinationTabId,
				{ messageId, data },
				{ frameId }
			) as Promise<MessageReturn<K>>
		).then((value) => ({
			frameId,
			value,
		}));
	});

	const results = await Promise.all(sending);
	return { results, values: results.map((result) => result.value) };
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
 * hints in `target` by their `frameId`. It will then send a message to each
 * frame and return an object in the shape `{ results, values }`. The `values`
 * property is just the values within `results` unwrapped. They are provided
 * like this for better ergonomics.
 */
export async function sendMessagesToTargetFrames<K extends MessageWithTarget>(
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
		).then((value) => ({
			frameId,
			value,
		}));
	});

	const results = await Promise.all(sending);

	return { results, values: results.map((result) => result.value) };
}
