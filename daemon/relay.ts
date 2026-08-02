import { platform } from "../shared/platform";
import { removeControlSocketFile } from "./lifecycle";
import type { ExtensionBridge } from "./extensionBridge";

/**
 * Runs in the singleton process. Accepts the one connection standing in for
 * "the extension" — either a relayed browser-spawned process's stdio, or (in
 * tests) a direct socket connection standing in for the extension leg.
 */
export function startControlSocketServer(bridge: ExtensionBridge) {
	removeControlSocketFile();

	return Bun.listen({
		unix: platform.controlSocketPath,
		socket: {
			open(socket) {
				bridge.attach((chunk) => {
					socket.write(chunk);
				});
			},
			data(_socket, chunk) {
				bridge.handleIncomingBytes(chunk);
			},
			close() {
				bridge.detach();
			},
			error(_socket, error) {
				console.error("rango daemon: control socket error", error);
			},
		},
	});
}

/**
 * Runs in a process the browser spawned as the native-messaging host while a
 * singleton was already running. Does no protocol-level work of its own — it
 * just pipes raw framed bytes between its own stdio (the browser's native
 * host pipe) and the singleton's control socket, so the singleton can treat
 * either connection kind identically.
 */
export async function runRelay(): Promise<void> {
	return new Promise((resolve) => {
		Bun.connect({
			unix: platform.controlSocketPath,
			socket: {
				open(socket) {
					process.stdin.on("data", (chunk: Buffer) => {
						socket.write(chunk);
					});
					process.stdin.on("close", () => {
						socket.end();
					});
				},
				data(_socket, chunk) {
					process.stdout.write(chunk);
				},
				close() {
					resolve();
				},
				error(_socket, error) {
					console.error("rango daemon: relay connection error", error);
					resolve();
				},
			},
		}).catch((error: unknown) => {
			console.error("rango daemon: failed to connect relay", error);
			resolve();
		});
	});
}
