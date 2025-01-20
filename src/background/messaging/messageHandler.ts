import { type SimplifyDeep } from "type-fest";
import { type Runtime, type Tabs } from "webextension-polyfill";
import { isValidMessage } from "../../common/messaging/isValidMessage";
import {
	type BackgroundBoundMessageMap,
	type MessageData,
	type MessageReturn,
} from "../../typings/ProtocolMap";

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
