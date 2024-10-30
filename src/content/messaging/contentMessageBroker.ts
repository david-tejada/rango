import browser from "webextension-polyfill";
import { isValidMessage } from "../../common/messaging/isValidMessage";
import type {
	BackgroundBoundMessageMap,
	ContentBoundMessageMap,
	MessageData,
	MessageReturn,
} from "../../typings/ProtocolMap";

const messageHandlers = new Map<keyof ContentBoundMessageMap, unknown>();

type OnMessageCallback<K extends keyof ContentBoundMessageMap> = (
	data: MessageData<K>
) => MessageReturn<K> | Promise<MessageReturn<K>>;

export function onMessage<K extends keyof ContentBoundMessageMap>(
	messageId: K,
	callback: OnMessageCallback<K>
) {
	if (messageHandlers.has(messageId)) {
		throw new Error("There can only be one message handler per messageId");
	}

	messageHandlers.set(messageId, callback);
}

export async function handleIncomingMessage<
	K extends keyof ContentBoundMessageMap,
>(message: unknown) {
	if (!isValidMessage(message)) {
		console.log(message);
		throw new Error("Invalid message coming from background script");
	}

	const { messageId, data } = message as {
		messageId: K;
		data: MessageData<K>;
	};

	const handler = messageHandlers.get(messageId) as OnMessageCallback<K>;
	if (!handler) {
		throw new Error(`No handler was register for the messageId "${messageId}"`);
	}

	return handler(data);
}

export async function sendMessage<K extends keyof BackgroundBoundMessageMap>(
	messageId: K,
	...args: MessageData<K> extends undefined ? [] : [data: MessageData<K>]
): Promise<MessageReturn<K>> {
	const data = args[0];
	return browser.runtime.sendMessage({ messageId, data });
}
