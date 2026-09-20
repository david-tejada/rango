import { type SimplifyDeep } from "type-fest";
import browser from "webextension-polyfill";
import { isValidMessage } from "../../common/messaging/isValidMessage";
import type {
	BackgroundBoundMessageMap,
	ContentBoundMessageMap,
	MessageData,
	MessageReturn,
} from "../../typings/ProtocolMap";

const messageHandlers = new Map<keyof ContentBoundMessageMap, unknown>();

type OnMessageCallback<K extends keyof ContentBoundMessageMap> = SimplifyDeep<
	(data: MessageData<K>) => MessageReturn<K> | Promise<MessageReturn<K>>
>;

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

const connectionErrorPattern =
	/could not establish connection|receiving end does not exist|message port closed|extension context invalidated/i;

function isConnectionError(error: unknown) {
	return error instanceof Error && connectionErrorPattern.test(error.message);
}

/**
 * Returns `true` if the extension has been reloaded, updated or disabled since
 * this content script started. The script is then orphaned and nothing it sends
 * will ever arrive, so there is no point retrying or logging.
 */
export function isContextInvalidated() {
	try {
		return !browser.runtime?.id;
	} catch {
		return true;
	}
}

/**
 * How long to wait before each retry. The service worker can be idle when we
 * send a message, and although sending is supposed to start it, in Chromium the
 * message is sometimes dropped while the worker is still starting up. Giving it
 * a moment and sending again is the practical way around it.
 */
const retryDelays = [50, 150, 400];

async function delay(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

export async function sendMessage<K extends keyof BackgroundBoundMessageMap>(
	messageId: K,
	...args: MessageData<K> extends undefined ? [] : [data: MessageData<K>]
): Promise<MessageReturn<K>> {
	const data = args[0];

	for (let attempt = 0; ; attempt++) {
		try {
			// eslint-disable-next-line no-await-in-loop
			return (await browser.runtime.sendMessage({
				messageId,
				data,
			})) as MessageReturn<K>;
		} catch (error: unknown) {
			if (
				isConnectionError(error) &&
				attempt < retryDelays.length &&
				!isContextInvalidated()
			) {
				// eslint-disable-next-line no-await-in-loop
				await delay(retryDelays[attempt]!);
				continue;
			}

			if (error instanceof Error && !isContextInvalidated()) {
				console.error("Background Script Error:", error.message);
			}

			throw error;
		}
	}
}
