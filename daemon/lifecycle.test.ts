import { afterAll, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// shared/platform.ts reads RANGO_HOME at import time, so it must be set
// before the first import. This is the only test file that imports
// shared/platform or daemon/lifecycle, so there's no risk of another file's
// import caching a different RANGO_HOME first.
const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "rango-lifecycle-"));
process.env["RANGO_HOME"] = tempHome;

const { platform } = await import("../shared/platform");
const lifecycle = await import("./lifecycle");

afterAll(() => {
	fs.rmSync(tempHome, { recursive: true, force: true });
});

describe("ensureHomeDir", () => {
	test("creates the home directory", () => {
		lifecycle.ensureHomeDir();
		expect(fs.existsSync(platform.home)).toBe(true);
	});
});

describe("pid file", () => {
	test("round-trips and reports missing as undefined", () => {
		lifecycle.removePidFile();
		expect(lifecycle.readPidFile()).toBeUndefined();

		lifecycle.writePidFile(12_345);
		expect(lifecycle.readPidFile()).toBe(12_345);

		lifecycle.removePidFile();
		expect(lifecycle.readPidFile()).toBeUndefined();
	});
});

describe("port file", () => {
	test("round-trips and reports missing as undefined", () => {
		lifecycle.removePortFile();
		expect(lifecycle.readPortFile()).toBeUndefined();

		lifecycle.writePortFile(54_321);
		expect(lifecycle.readPortFile()).toBe(54_321);

		lifecycle.removePortFile();
		expect(lifecycle.readPortFile()).toBeUndefined();
	});
});

describe("isProcessAlive", () => {
	test("is true for the current process and false for a bogus pid", () => {
		expect(lifecycle.isProcessAlive(process.pid)).toBe(true);
		expect(lifecycle.isProcessAlive(999_999)).toBe(false);
	});
});

describe("checkExistingSingleton", () => {
	test("reports not alive when no pid file exists", () => {
		lifecycle.removePidFile();
		expect(lifecycle.checkExistingSingleton()).toEqual({ alive: false });
	});

	test("reports alive with the pid when the pid file points at a live process", () => {
		lifecycle.writePidFile(process.pid);
		expect(lifecycle.checkExistingSingleton()).toEqual({
			alive: true,
			pid: process.pid,
		});
		lifecycle.removePidFile();
	});

	test("treats a stale pid file as not alive", () => {
		lifecycle.writePidFile(999_999);
		expect(lifecycle.checkExistingSingleton()).toEqual({ alive: false });
		lifecycle.removePidFile();
	});
});
