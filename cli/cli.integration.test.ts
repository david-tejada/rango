import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { encodeFrame, FrameDecoder } from "../shared/frame";

/**
 * Exercises the real rango-cli binary end to end: CLI -> daemon (auto-spawned
 * by the CLI itself, mirroring real usage) -> control socket -> mock
 * extension -> response -> CLI stdout. Paths are computed manually rather
 * than imported from shared/platform, for the same import-time-env-var
 * reason documented in daemon/daemon.integration.test.ts.
 */

const repoRoot = path.join(import.meta.dir, "..");
const cliEntry = path.join(repoRoot, "cli", "index.ts");

let tempHome: string;
let mockExtensionSocket: Bun.Socket<undefined> | undefined;

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

async function runCli(
	...args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	const proc = Bun.spawn(["bun", "run", cliEntry, ...args], {
		cwd: repoRoot,
		env: { ...process.env, RANGO_HOME: tempHome },
		stdio: ["ignore", "pipe", "pipe"],
	});

	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);

	return { stdout, stderr, exitCode };
}

beforeAll(async () => {
	tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "rango-cli-it-"));
});

afterAll(() => {
	mockExtensionSocket?.end();

	const { pidFile } = paths(tempHome);
	try {
		const pid = Number(fs.readFileSync(pidFile, "utf8").trim());
		if (Number.isFinite(pid)) process.kill(pid, "SIGTERM");
	} catch {
		// No daemon left running; nothing to clean up.
	}

	fs.rmSync(tempHome, { recursive: true, force: true });
});

describe("rango-cli status", () => {
	test("auto-spawns the daemon and prints its port", async () => {
		const { stdout, exitCode } = await runCli("status");

		expect(exitCode).toBe(0);
		const body = JSON.parse(stdout.trim());
		expect(body.ok).toBe(true);
		expect(typeof body.port).toBe("number");
	});
});

describe("rango-cli click <label>", () => {
	test("round-trips through the auto-spawned daemon and a mock extension", async () => {
		const { controlSocketPath } = paths(tempHome);
		const decoder = new FrameDecoder();

		await waitFor(async () => {
			try {
				mockExtensionSocket = await Bun.connect({
					unix: controlSocketPath,
					socket: {
						data(socket, chunk) {
							for (const message of decoder.push(chunk)) {
								const request = message as {
									id: string;
									action: { name: string; [key: string]: unknown };
								};
								socket.write(
									encodeFrame({
										id: request.id,
										success: true,
										data: { clicked: request.action["target"] },
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

		const { stdout, stderr, exitCode } = await runCli("click", "aa");

		expect(stderr).toBe("");
		expect(exitCode).toBe(0);
		const body = JSON.parse(stdout.trim());
		expect(body.clicked).toEqual({
			type: "primitive",
			mark: { type: "elementHint", value: "AA" },
		});
	});
});

describe("rango-cli with no arguments", () => {
	test("prints usage and exits 0", async () => {
		const { stdout, exitCode } = await runCli();
		expect(exitCode).toBe(0);
		expect(stdout).toContain("rango-cli");
	});
});

describe("rango-cli click with no label", () => {
	test("fails with a usage error", async () => {
		const { stderr, exitCode } = await runCli("click");
		expect(exitCode).toBe(1);
		expect(stderr).toContain("Usage:");
	});
});
