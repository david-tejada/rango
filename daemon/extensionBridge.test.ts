import { describe, expect, test } from "bun:test";
import { encodeFrame, FrameDecoder } from "../shared/frame";
import { ExtensionBridge } from "./extensionBridge";

describe("ExtensionBridge", () => {
	test("reports disconnected with no writer attached", async () => {
		const bridge = new ExtensionBridge(1000);
		expect(bridge.connected).toBe(false);

		const result = await bridge.send({ name: "clickElement" });
		expect(result).toEqual({
			id: "",
			success: false,
			error: "No extension connected.",
		});
	});

	test("sends a framed request and resolves on a matching framed response", async () => {
		const bridge = new ExtensionBridge(1000);
		const written: Uint8Array[] = [];
		bridge.attach((chunk) => written.push(chunk));

		const resultPromise = bridge.send({ name: "clickElement", target: "x" });

		expect(written).toHaveLength(1);
		const decoder = new FrameDecoder();
		const [sent] = decoder.push(written[0]!) as [
			{ id: string; action: { name: string; target?: string } },
		];
		expect(sent.action).toEqual({ name: "clickElement", target: "x" });

		bridge.handleIncomingBytes(
			encodeFrame({ id: sent.id, success: true, data: { clicked: true } })
		);

		await expect(resultPromise).resolves.toEqual({
			id: sent.id,
			success: true,
			data: { clicked: true },
		});
	});

	test("detach rejects in-flight requests and flips connected to false", async () => {
		const bridge = new ExtensionBridge(1000);
		bridge.attach(() => {});
		const resultPromise = bridge.send({ name: "refreshHints" });

		bridge.detach();

		expect(bridge.connected).toBe(false);
		const result = await resultPromise;
		expect(result.success).toBe(false);
	});

	test("assembles a response split across multiple incoming chunks", async () => {
		const bridge = new ExtensionBridge(1000);
		const written: Uint8Array[] = [];
		bridge.attach((chunk) => written.push(chunk));

		const resultPromise = bridge.send({ name: "clickElement" });

		const decoder = new FrameDecoder();
		const [sent] = decoder.push(written[0]!) as [{ id: string }];
		const frame = Buffer.from(encodeFrame({ id: sent.id, success: true }));

		bridge.handleIncomingBytes(frame.subarray(0, 4));
		bridge.handleIncomingBytes(frame.subarray(4));

		await expect(resultPromise).resolves.toEqual({
			id: sent.id,
			success: true,
		});
	});
});
