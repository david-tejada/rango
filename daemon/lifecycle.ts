import fs from "node:fs";
import { platform } from "../shared/platform";

export function ensureHomeDir() {
	fs.mkdirSync(platform.home, { recursive: true });
}

export function isProcessAlive(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

export function readPidFile(): number | undefined {
	try {
		const pid = Number(fs.readFileSync(platform.pidFile, "utf8").trim());
		return Number.isFinite(pid) ? pid : undefined;
	} catch {
		return undefined;
	}
}

export function writePidFile(pid: number) {
	fs.writeFileSync(platform.pidFile, String(pid));
}

export function removePidFile() {
	try {
		fs.unlinkSync(platform.pidFile);
	} catch {
		// Nothing to remove.
	}
}

export function readPortFile(): number | undefined {
	try {
		const port = Number(fs.readFileSync(platform.portFile, "utf8").trim());
		return Number.isFinite(port) ? port : undefined;
	} catch {
		return undefined;
	}
}

export function writePortFile(port: number) {
	fs.writeFileSync(platform.portFile, String(port));
}

export function removePortFile() {
	try {
		fs.unlinkSync(platform.portFile);
	} catch {
		// Nothing to remove.
	}
}

export function removeControlSocketFile() {
	try {
		fs.unlinkSync(platform.controlSocketPath);
	} catch {
		// Nothing to remove.
	}
}

export type SingletonStatus = { alive: true; pid: number } | { alive: false };

/**
 * The PID file is advisory only (a process could die and leave a stale file).
 * Real exclusivity comes from whichever process manages to bind the control
 * socket first, mirroring Interceptor's two-layer singleton election.
 */
export function checkExistingSingleton(): SingletonStatus {
	const pid = readPidFile();
	if (pid !== undefined && isProcessAlive(pid)) return { alive: true, pid };
	return { alive: false };
}
