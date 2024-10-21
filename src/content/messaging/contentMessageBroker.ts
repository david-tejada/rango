import browser from "webextension-polyfill";
import type {
	GetDataType,
	GetReturnType,
	ProtocolMap,
} from "../../typings/ProtocolMap";
import { isValidMessage } from "../../common/messaging/isValidMessage";

const messageHandlers = new Map<keyof ProtocolMap, unknown>();

type OnMessageCallback<K extends keyof ProtocolMap> = (
	data: GetDataType<K>
) => GetReturnType<K> | Promise<GetReturnType<K>>;

export function onMessage<K extends keyof ProtocolMap>(
	messageId: K,
	callback: OnMessageCallback<K>
) {
	if (messageHandlers.has(messageId)) {
		throw new Error("There can only be one message handler per messageId");
	}

	messageHandlers.set(messageId, callback);
}

export async function handleIncomingMessage<K extends keyof ProtocolMap>(
	message: unknown
) {
	if (!isValidMessage(message)) {
		throw new Error("Invalid message coming from background script");
	}

	const { messageId, data } = message as { messageId: K; data: GetDataType<K> };

	const handler = messageHandlers.get(messageId) as OnMessageCallback<K>;
	if (!handler) {
		throw new Error(`No handler was register for the messageId "${messageId}"`);
	}

	return handler(data);
}

export async function sendMessage<K extends keyof ProtocolMap>(
	messageId: K,
	...args: GetDataType<K> extends undefined ? [] : [GetDataType<K>]
): Promise<GetReturnType<K>> {
	const data = args[0];
	return browser.runtime.sendMessage({ messageId, data });
}
