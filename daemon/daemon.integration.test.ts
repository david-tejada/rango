import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { encodeFrame, FrameDecoder } from "../shared/frame";

/**
 * Spawns the real daemon binary and talks to it exactly as its two real
 * clients would: HTTP for the CLI leg, and a raw socket connection standing
 * in for "the extension" on the control-socket leg (the same leg a relayed
 * browser-spawned process would use). No live browser is available in CI, so
 * this mock socket client is the substitute the acceptance criteria call for.
 *
 * Deliberately avoids importing shared/platform or daemon/lifecycle here:
 * those modules read RANGO_HOME at import time, and daemon/lifecycle.test.ts
 * (which runs in the same bun test process) imports them under a different
 * RANGO_HOME. Paths below are computed manually to match shared/platform.ts.
 */

const repoRoot = path.join(import.meta.dir, "..");
const daemonEntry = path.join(repoRoot, "daemon", "index.ts");

let tempHome: string;
let daemonProcess: ReturnType<typeof Bun.spawn>;
let port: number;

function paths(home: string) {
	return {
		pidFile: path.join(home, "daemon.pid"),
		portFile: path.join(home, "daemon.port"),
		controlSocketPath: path.join(home, "daemon.sock"),
	};
}

async function waitFor(
	check: () => boolean | Promise<boolean>,
	timeoutMs = 10_000
): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (await check()) return;
		await Bun.sleep(50);
	}

	throw new Error("Timed out waiting for condition.");
}

beforeAll(async () => {
	tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "rango-daemon-it-"));

	daemonProcess = Bun.spawn(["bun", "run", daemonEntry, "--standalone"], {
		cwd: repoRoot,
		env: { ...process.env, RANGO_HOME: tempHome },
		stdio: ["ignore", "ignore", "ignore"],
	});

	const { portFile } = paths(tempHome);
	await waitFor(() => fs.existsSync(portFile));
	port = Number(fs.readFileSync(portFile, "utf8").trim());

	await waitFor(async () => {
		try {
			const response = await fetch(`http://127.0.0.1:${port}/health`);
			return response.ok;
		} catch {
			return false;
		}
	});
});

afterAll(() => {
	daemonProcess.kill();
	fs.rmSync(tempHome, { recursive: true, force: true });
});

describe("GET /health", () => {
	test("reports the daemon pid and no extension connected yet", async () => {
		const response = await fetch(`http://127.0.0.1:${port}/health`);
		const body = await response.json();

		expect(response.ok).toBe(true);
		expect(body).toMatchObject({ ok: true, extensionConnected: false });
		expect(typeof body.pid).toBe("number");
	});
});

describe("POST /command with no extension connected", () => {
	test("responds 503", async () => {
		const response = await fetch(`http://127.0.0.1:${port}/command`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ action: { name: "refreshHints" } }),
		});

		expect(response.status).toBe(503);
		const body = await response.json();
		expect(body.success).toBe(false);
	});
});

describe("POST /command with a malformed body", () => {
	test("responds 400", async () => {
		const response = await fetch(`http://127.0.0.1:${port}/command`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ notAnAction: true }),
		});

		expect(response.status).toBe(400);
	});
});

describe("full round trip through a mock extension on the control socket", () => {
	test("relays the request and returns the mock extension's response", async () => {
		const { controlSocketPath } = paths(tempHome);
		const decoder = new FrameDecoder();
		let socket: Bun.Socket<undefined> | undefined;

		await waitFor(async () => {
			try {
				socket = await Bun.connect({
					unix: controlSocketPath,
					socket: {
						data(_socket, chunk) {
							for (const message of decoder.push(chunk)) {
								const request = message as {
									id: string;
									action: { name: string; [key: string]: unknown };
								};
								socket!.write(
									encodeFrame({
										id: request.id,
										success: true,
										data: { echoed: request.action.name },
									})
								);
							}
						},
						open() {},
						close() {},
						error() {},
					},
				});
				return true;
			} catch {
				return false;
			}
		});

		await waitFor(async () => {
			const response = await fetch(`http://127.0.0.1:${port}/health`);
			const body = await response.json();
			return body.extensionConnected === true;
		});

		const response = await fetch(`http://127.0.0.1:${port}/command`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				action: { name: "clickElement", target: "A" },
			}),
		});

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toMatchObject({
			success: true,
			data: { echoed: "clickElement" },
		});

		socket!.end();
	});
});
