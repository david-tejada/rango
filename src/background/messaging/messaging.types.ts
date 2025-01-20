import {
	type ContentBoundMessageMap,
	type MessageData,
} from "../../typings/ProtocolMap";
import { type ElementMark, type Target } from "../../typings/Target/Target";

export type MessageWithoutTarget = {
	[K in keyof ContentBoundMessageMap]: MessageData<K> extends {
		target: Target<ElementMark>;
	}
		? never
		: K;
}[keyof ContentBoundMessageMap];

export type HasRequiredData<K extends MessageWithoutTarget> =
	MessageData<K> extends undefined ? false : true;
