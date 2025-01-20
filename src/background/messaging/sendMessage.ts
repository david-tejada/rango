import browser from "webextension-polyfill";
import type { MessageData, MessageReturn } from "../../typings/ProtocolMap";
import { getRequiredCurrentTabId } from "../tabs/getCurrentTab";
import {
	type HasRequiredData,
	type MessageWithoutTarget,
} from "./messaging.types";
import { pingContentScript } from "./pingContentScript";

type MessageOptions = {
	tabId?: number;
	frameId?: number;
	maxWait?: number;
};

export async function sendMessage<K extends MessageWithoutTarget>(
	messageId: K,
	...args: HasRequiredData<K> extends true
		? [data: MessageData<K>, options?: MessageOptions]
		: [data?: MessageData<K>, options?: MessageOptions]
): Promise<MessageReturn<K>> {
	const [data, options] = args;
	const tabId = options?.tabId ?? (await getRequiredCurrentTabId());
	await pingContentScript(tabId);

	try {
		const messagePromise = browser.tabs.sendMessage(
			tabId,
			{ messageId, data },
			{ frameId: options?.frameId ?? 0 }
		) as Promise<MessageReturn<K>>;

		if (!options?.maxWait) return await messagePromise;

		const timeoutPromise = new Promise<MessageReturn<K>>((_resolve, reject) => {
			setTimeout(() => {
				reject(
					new Error("Message timeout: Operation took too long to complete")
				);
			}, options.maxWait);
		});

		return await Promise.race([messagePromise, timeoutPromise]);
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
		? [data: MessageData<K>, options?: MessageOptions]
		: [data?: MessageData<K>, options?: MessageOptions]
) {
	try {
		return await sendMessage(messageId, ...args);
	} catch {
		// Silently ignore errors
		return undefined;
	}
}
