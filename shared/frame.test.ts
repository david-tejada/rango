import { describe, expect, test } from "bun:test";
import { encodeFrame, FrameDecoder } from "./frame";

describe("encodeFrame / FrameDecoder", () => {
	test("round-trips a single message", () => {
		const decoder = new FrameDecoder();
		const frame = encodeFrame({ id: "1", action: { name: "clickElement" } });
		const messages = decoder.push(frame);

		expect(messages).toEqual([{ id: "1", action: { name: "clickElement" } }]);
	});

	test("decodes multiple messages arriving in one chunk", () => {
		const decoder = new FrameDecoder();
		const combined = Buffer.concat([
			Buffer.from(encodeFrame({ n: 1 })),
			Buffer.from(encodeFrame({ n: 2 })),
		]);

		expect(decoder.push(combined)).toEqual([{ n: 1 }, { n: 2 }]);
	});

	test("decodes a message split across multiple chunks", () => {
		const decoder = new FrameDecoder();
		const frame = Buffer.from(encodeFrame({ hello: "world" }));

		expect(decoder.push(frame.subarray(0, 3))).toEqual([]);
		expect(decoder.push(frame.subarray(3, 6))).toEqual([]);
		expect(decoder.push(frame.subarray(6))).toEqual([{ hello: "world" }]);
	});

	test("holds a partial trailing message until the rest arrives", () => {
		const decoder = new FrameDecoder();
		const first = Buffer.from(encodeFrame({ n: 1 }));
		const second = Buffer.from(encodeFrame({ n: 2 }));

		expect(decoder.push(Buffer.concat([first, second.subarray(0, 2)]))).toEqual(
			[{ n: 1 }]
		);
		expect(decoder.push(second.subarray(2))).toEqual([{ n: 2 }]);
	});
});
