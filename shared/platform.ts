import os from "node:os";
import path from "node:path";

const home = process.env["RANGO_HOME"] ?? path.join(os.homedir(), ".rango");

export const platform = {
	home,
	pidFile: path.join(home, "daemon.pid"),
	portFile: path.join(home, "daemon.port"),
	controlSocketPath:
		process.env["RANGO_CONTROL_SOCKET"] ?? path.join(home, "daemon.sock"),
	logFile: path.join(home, "daemon.log"),
};

export const REQUEST_TIMEOUT_MS = Number(
	process.env["RANGO_REQUEST_TIMEOUT_MS"] ?? 15_000
);

// Chrome's native messaging host protocol has an undocumented but
// empirically-real ~1MB practical ceiling per message. Mirrors Interceptor's
// NATIVE_HOST_TO_CHROME_MAX_BYTES guard.
export const NATIVE_MESSAGE_MAX_BYTES = 1024 * 1024;
