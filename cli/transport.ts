import path from "node:path";
import { platform, REQUEST_TIMEOUT_MS } from "../shared/platform";
import { isProcessAlive, readPidFile, readPortFile } from "../daemon/lifecycle";

const daemonEntry = path.join(import.meta.dir, "..", "daemon", "index.ts");

async function pingHealth(port: number): Promise<boolean> {
	try {
		const response = await fetch(`http://127.0.0.1:${port}/health`, {
			signal: AbortSignal.timeout(1000),
		});
		return response.ok;
	} catch {
		return false;
	}
}

async function spawnDaemon(): Promise<void> {
	Bun.spawn(["bun", "run", daemonEntry, "--standalone"], {
		stdio: ["ignore", "ignore", "ignore"],
	}).unref();
}

async function waitForDaemon(timeoutMs = 5000): Promise<number> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		const port = readPortFile();
		if (port !== undefined && (await pingHealth(port))) return port;
		await Bun.sleep(100);
	}

	throw new Error(
		`Timed out waiting for the rango daemon to start. Check ${platform.logFile}.`
	);
}

/** Finds a running daemon, or spawns one and waits for it to become healthy. */
export async function ensureDaemon(): Promise<number> {
	const pid = readPidFile();
	const port = readPortFile();
	if (pid !== undefined && port !== undefined && isProcessAlive(pid)) {
		if (await pingHealth(port)) return port;
	}

	await spawnDaemon();
	return waitForDaemon();
}

export type CommandResult =
	| { id?: string; success: true; data?: unknown }
	| { id?: string; success: false; error: string };

export async function sendCommand(action: {
	name: string;
	[key: string]: unknown;
}): Promise<CommandResult> {
	const port = await ensureDaemon();
	const response = await fetch(`http://127.0.0.1:${port}/command`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ action }),
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS + 2000),
	});

	return (await response.json()) as CommandResult;
}
