import {
	type DataTypeKey as _DataTypeKey,
	type Endpoint as _Endpoint,
	type GetDataType as _GetDataType,
	type GetReturnType as _GetReturnType,
	type ProtocolMap as _ProtocolMap,
	type RuntimeContext as _RuntimeContext,
} from "webext-bridge";
import {
	onMessage as _onMessage,
	sendMessage as _sendMessage,
} from "webext-bridge/background";
import browser from "webextension-polyfill";

export const sendMessageToAllFrames = async <T extends keyof _ProtocolMap>(
	messageId: T,
	data: _GetDataType<T, null>,
	tabId: number
) => {
	const allFrames = await browser.webNavigation.getAllFrames({ tabId });
	if (!allFrames) return [];

	return Promise.all(
		allFrames.map(({ frameId }) => ({
			frameId,
			result: _sendMessage(
				messageId,
				data,
				`content-script@${tabId}.${frameId}`
			),
		}))
	);
};

type BaseEndpoint = {
	context: _RuntimeContext;
};

type Endpoint<Context extends _RuntimeContext> = BaseEndpoint &
	(Context extends "content-script"
		? { tabId: number; frameId: number }
		: Context extends "devtools" | "window"
			? { tabId: number }
			: {});

type BridgeMessage<Key extends _DataTypeKey, Sender extends _Endpoint> = {
	sender: Sender;
	id: string;
	data: _GetDataType<Key, null>;
	timestamp: number;
};

type OnMessageCallback<
	Key extends keyof _ProtocolMap,
	Context extends _RuntimeContext,
	Sender extends _Endpoint = Endpoint<Context>,
> = (
	message: BridgeMessage<Key, Sender>
) => _GetReturnType<Key> | Promise<_GetReturnType<Key>>;

export function onMessage<
	T extends keyof _ProtocolMap,
	C extends _RuntimeContext = "content-script",
>(
	messageId: T,
	callback: OnMessageCallback<T, C>,
	expectedContext: C = "content-script" as C
) {
	const wrappedCallback: OnMessageCallback<T, C, _Endpoint> = async ({
		sender,
		...rest
	}) => {
		if (sender.context !== expectedContext) {
			throw new TypeError(
				`Destination context "${expectedContext}" doesn't match sender context "${sender.context}`
			);
		}

		switch (sender.context) {
			case "devtools":
			case "window": {
				if (typeof sender.tabId !== "number") {
					throw new TypeError("Message sender didn't have a tabId.");
				}

				return callback({ sender: sender as Endpoint<C>, ...rest });
			}

			case "content-script": {
				if (
					// I can't trust the types coming from webext-bridge. Sometimes tabId
					// can be null, or even maybe NaN.
					typeof sender.tabId !== "number" ||
					typeof sender.frameId !== "number"
				) {
					throw new TypeError("Message sender didn't have a tabId or frameId");
				}

				return callback({ sender: sender as Endpoint<C>, ...rest });
			}

			default: {
				return callback({ sender: sender as Endpoint<C>, ...rest });
			}
		}
	};

	return _onMessage(messageId, wrappedCallback);
}
