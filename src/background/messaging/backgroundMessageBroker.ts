import browser, { type Runtime, type Tabs } from "webextension-polyfill";
import { isValidMessage } from "../../common/messaging/isValidMessage";
import type {
	BackgroundBoundMessageMap,
	ContentBoundMessageMap,
	GetDataType,
	GetReturnType,
} from "../../typings/ProtocolMap";
import { getCurrentTabId } from "../utils/getCurrentTab";
import { splitHintsByFrame } from "../utils/splitHintsByFrame";

type Destination = { tabId?: number; frameId?: number };
type Sender = { tab: Tabs.Tab; tabId: number; frameId: number };

type OnMessageCallback<K extends keyof BackgroundBoundMessageMap> = (
	data: GetDataType<K>,
	sender: Sender
) => GetReturnType<K> | Promise<GetReturnType<K>>;

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

	const { messageId, data } = message as { messageId: K; data: GetDataType<K> };

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
	[K in keyof ContentBoundMessageMap]: GetDataType<K> extends {
		target: string[];
	}
		? never
		: K;
}[keyof ContentBoundMessageMap];

export async function sendMessage<K extends MessageWithoutTarget>(
	messageId: K,
	data: GetDataType<K>,
	destination?: Destination
): Promise<GetReturnType<K>> {
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
	data: GetDataType<K>,
	tabId?: number
) {
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
			) as Promise<GetReturnType<K>>
		).then((value) => ({
			frameId,
			value,
		}));
	});

	const results = await Promise.all(sending);
	return { results, values: results.map((result) => result.value) };
}

type MessageWithTarget = {
	[K in keyof ContentBoundMessageMap]: GetDataType<K> extends {
		target: string[];
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
	data: NonNullable<GetDataType<K>>,
	tabId?: number
) {
	const destinationTabId = tabId ?? (await getCurrentTabId());
	await pingContentScript(destinationTabId);

	const hintsByFrameMap = await splitHintsByFrame(
		destinationTabId,
		data.target
	);

	const sending = [...hintsByFrameMap].map(async ([frameId, hints]) => {
		const frameData = { ...data, target: hints };
		return (
			browser.tabs.sendMessage(
				destinationTabId,
				{ messageId, data: frameData },
				{ frameId }
			) as Promise<GetReturnType<K>>
		).then((value) => ({
			frameId,
			value,
		}));
	});

	const results = await Promise.all(sending);

	return { results, values: results.map((result) => result.value) };
}
