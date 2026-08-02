#!/usr/bin/env bun
import {
	clickHintAction,
	hideHintsAction,
	refreshHintsAction,
	showHintsAction,
} from "./commands";
import { ensureDaemon, sendCommand, type CommandResult } from "./transport";

const USAGE = `rango-cli — drive Rango hint navigation from the command line

Usage:
  rango-cli status                Start/check the daemon and print its port
  rango-cli hints show            Enable hints (temporary overlay)
  rango-cli hints hide            Disable hints
  rango-cli click <hint-label>    Click the element under a hint label
  rango-cli navigate <hint-label> Show hints, then click one (end-to-end)
`;

async function run(action: { name: string; [key: string]: unknown }) {
	const result = await sendCommand(action);
	if (!result.success) {
		throw new Error(result.error ?? `Command "${action.name}" failed.`);
	}

	return result;
}

function printResult(result: CommandResult) {
	if (result.success && result.data !== undefined) {
		console.log(JSON.stringify(result.data));
	}
}

async function main() {
	const [command, ...rest] = process.argv.slice(2);

	switch (command) {
		case "status": {
			const port = await ensureDaemon();
			console.log(JSON.stringify({ ok: true, port }));
			return;
		}

		case "hints": {
			const sub = rest[0];
			if (sub === "show") {
				await run(showHintsAction);
				printResult(await run(refreshHintsAction));
			} else if (sub === "hide") {
				await run(hideHintsAction);
			} else {
				throw new Error("Usage: rango-cli hints <show|hide>");
			}

			return;
		}

		case "click": {
			printResult(await run(clickHintAction(rest[0] ?? "")));
			return;
		}

		case "navigate": {
			await run(showHintsAction);
			await run(refreshHintsAction);
			// Give the overlay a moment to render before targeting a hint.
			await Bun.sleep(150);
			printResult(await run(clickHintAction(rest[0] ?? "")));
			return;
		}

		default: {
			console.log(USAGE);
			process.exitCode = command ? 1 : 0;
		}
	}
}

try {
	await main();
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
}
