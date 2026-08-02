/**
 * 4-byte little-endian length prefix + UTF-8 JSON, matching the wire format
 * Chrome/Firefox require for native-messaging host stdio. Both the daemon's
 * control socket (singleton <-> relay) and its stdio (singleton <-> browser)
 * use this same framing so bytes can be piped between them verbatim.
 */
export function encodeFrame(payload: unknown): Uint8Array {
	const json = Buffer.from(JSON.stringify(payload), "utf8");
	const header = Buffer.alloc(4);
	header.writeUInt32LE(json.byteLength, 0);
	return Buffer.concat([header, json]);
}

export class FrameDecoder {
	private buffer = Buffer.alloc(0);

	/** Feed in newly-received bytes; returns any complete messages found. */
	push(chunk: Uint8Array): unknown[] {
		this.buffer = Buffer.concat([this.buffer, Buffer.from(chunk)]);
		const messages: unknown[] = [];

		for (;;) {
			if (this.buffer.byteLength < 4) break;
			const length = this.buffer.readUInt32LE(0);
			if (this.buffer.byteLength < 4 + length) break;

			const json = this.buffer.subarray(4, 4 + length);
			messages.push(JSON.parse(json.toString("utf8")));
			this.buffer = this.buffer.subarray(4 + length);
		}

		return messages;
	}
}
