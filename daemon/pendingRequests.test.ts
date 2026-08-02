import { describe, expect, test } from "bun:test";
import { PendingRequests } from "./pendingRequests";

describe("PendingRequests", () => {
	test("resolves a registered request when its response arrives", async () => {
		const pending = new PendingRequests(1000);
		const promise = pending.register("abc");

		expect(pending.resolve({ id: "abc", success: true, data: 42 })).toBe(true);
		await expect(promise).resolves.toEqual({
			id: "abc",
			success: true,
			data: 42,
		});
		expect(pending.size).toBe(0);
	});

	test("ignores a response for an unknown or already-resolved id", () => {
		const pending = new PendingRequests(1000);
		pending.register("abc");
		pending.resolve({ id: "abc", success: true });

		expect(pending.resolve({ id: "abc", success: true })).toBe(false);
		expect(pending.resolve({ id: "does-not-exist", success: true })).toBe(
			false
		);
	});

	test("times out a request that never gets a response", async () => {
		const pending = new PendingRequests(10);
		const promise = pending.register("abc");

		const result = await promise;
		expect(result.success).toBe(false);
		expect(pending.size).toBe(0);
	});

	test("rejectAll resolves every pending request with the given error", async () => {
		const pending = new PendingRequests(5000);
		const a = pending.register("a");
		const b = pending.register("b");

		pending.rejectAll("extension disconnected");

		expect(await a).toEqual({
			id: "a",
			success: false,
			error: "extension disconnected",
		});
		expect(await b).toEqual({
			id: "b",
			success: false,
			error: "extension disconnected",
		});
		expect(pending.size).toBe(0);
	});
});
