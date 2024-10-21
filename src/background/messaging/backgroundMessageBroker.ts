import browser, { type Runtime, type Tabs } from "webextension-polyfill";
import { isValidMessage } from "../../common/messaging/isValidMessage";
import type {
	GetDataType,
	GetReturnType,
	ProtocolMap,
} from "../../typings/ProtocolMap";
import { getCurrentTabId } from "../utils/getCurrentTab";

type Destination = { tabId?: number; frameId?: number };
type Sender = { tab: Tabs.Tab; tabId: number; frameId: number };

type OnMessageCallback<K extends keyof ProtocolMap> = (
	data: GetDataType<K>,
	sender: Sender
) => GetReturnType<K> | Promise<GetReturnType<K>>;

const messageHandlers = new Map<keyof ProtocolMap, unknown>();

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
	message: unknown,
	sender: Runtime.MessageSender
) {
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

export async function sendMessage<K extends keyof ProtocolMap>(
	messageId: K,
	data: GetDataType<K>,
	destination?: Destination
): Promise<GetReturnType<K>> {
	const currentTabId = await getCurrentTabId();
	return browser.tabs.sendMessage(
		destination?.tabId ?? currentTabId,
		{ messageId, data },
		{ frameId: destination?.frameId ?? 0 }
	);
}
