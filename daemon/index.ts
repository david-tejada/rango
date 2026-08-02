#!/usr/bin/env bun
import { REQUEST_TIMEOUT_MS } from "../shared/platform";
import { ExtensionBridge } from "./extensionBridge";
import { createHttpServer } from "./httpServer";
import {
	checkExistingSingleton,
	ensureHomeDir,
	removeControlSocketFile,
	removePidFile,
	removePortFile,
	writePidFile,
	writePortFile,
} from "./lifecycle";
import { runRelay, startControlSocketServer } from "./relay";

async function main() {
	ensureHomeDir();

	const standalone = process.argv.includes("--standalone");
	const existing = checkExistingSingleton();

	if (existing.alive) {
		if (standalone) {
			console.log(`rango daemon already running (pid ${existing.pid}).`);
			return;
		}

		// The browser spawned us as the native-messaging host, but a singleton
		// is already serving the CLI's HTTP leg. Become a transparent relay.
		await runRelay();
		return;
	}

	await runSingleton(standalone);
}

async function runSingleton(standalone: boolean) {
	writePidFile(process.pid);

	const bridge = new ExtensionBridge(REQUEST_TIMEOUT_MS);
	const server = createHttpServer(bridge);
	if (server.port === undefined) {
		throw new Error("Daemon HTTP server did not bind to a port.");
	}

	writePortFile(server.port);
	const controlSocket = startControlSocketServer(bridge);

	if (!standalone) {
		// We were spawned directly by the browser as the native-messaging host;
		// our own stdio *is* the extension connection.
		process.stdin.on("data", (chunk: Buffer) => {
			bridge.handleIncomingBytes(chunk);
		});
		process.stdin.on("close", () => {
			bridge.detach();
		});
		bridge.attach((chunk) => {
			process.stdout.write(chunk);
		});
	}

	let shuttingDown = false;
	const shutdown = () => {
		if (shuttingDown) return;
		shuttingDown = true;
		removePidFile();
		removePortFile();
		removeControlSocketFile();
		controlSocket.stop();
		server.stop(true);
		process.exit(0);
	};

	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);

	console.log(`rango daemon listening on http://127.0.0.1:${server.port}`);

	// Keep the event loop alive; Bun.serve/Bun.listen alone don't block exit
	// once stdin closes (e.g. after the browser tears down a native host).
	await new Promise(() => {});
}

await main();
