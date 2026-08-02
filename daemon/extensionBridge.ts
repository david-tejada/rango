import { randomUUID } from "node:crypto";
import { encodeFrame, FrameDecoder } from "../shared/frame";
import {
	type CommandAction,
	type ExtensionToDaemonResponse,
	isExtensionResponse,
} from "../shared/protocol";
import { PendingRequests } from "./pendingRequests";

type Writer = (chunk: Uint8Array) => void;

/**
 * The daemon's one connection to "the extension" — whether that byte stream
 * is this process's own stdio (spawned directly by the browser as the native
 * host) or a relayed control-socket connection (forwarded from a sibling
 * process the browser spawned while this singleton was already running) is
 * transparent to this class; both speak the same length-prefixed JSON frames.
 */
export class ExtensionBridge {
	private writer: Writer | undefined;
	private readonly decoder = new FrameDecoder();
	private readonly pending: PendingRequests;

	constructor(timeoutMs: number) {
		this.pending = new PendingRequests(timeoutMs);
	}

	get connected(): boolean {
		return this.writer !== undefined;
	}

	attach(writer: Writer) {
		this.writer = writer;
	}

	detach() {
		this.writer = undefined;
		this.pending.rejectAll("The extension disconnected.");
	}

	handleIncomingBytes(chunk: Uint8Array) {
		for (const message of this.decoder.push(chunk)) {
			if (isExtensionResponse(message)) this.pending.resolve(message);
		}
	}

	async send(action: CommandAction): Promise<ExtensionToDaemonResponse> {
		if (!this.writer) {
			return { id: "", success: false, error: "No extension connected." };
		}

		const id = randomUUID();
		const response = this.pending.register(id);
		this.writer(encodeFrame({ id, action }));
		return response;
	}
}
