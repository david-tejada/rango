/* eslint-disable no-await-in-loop */
import { keyTap } from "@hurdlegroup/robotjs";
import clipboard from "clipboardy";
import { sleep } from "./testHelpers";

async function waitForCompletion() {
	let message: any;

	while (!message || message.type !== "response") {
		const clip = clipboard.readSync();

		try {
			message = JSON.parse(clip) as unknown;
		} catch {}

		await sleep(10);
	}
}

export async function rangoCommandWithTarget(
	actionType: string,
	target: string[],
	arg?: string | number
) {
	const command = {
		version: 1,
		type: "request",
		action: {
			type: actionType,
			target,
			arg,
		},
	};

	const commandString = JSON.stringify(command);

	clipboard.writeSync(commandString);
	keyTap("3", ["control", "shift"]);
	await waitForCompletion();
}

export async function rangoCommandWithoutTarget(
	actionType: string,
	arg?: string | number
) {
	const command = {
		version: 1,
		type: "request",
		action: {
			type: actionType,
			arg,
		},
	};

	const commandString = JSON.stringify(command);

	clipboard.writeSync(commandString);
	keyTap("3", ["control", "shift"]);
	await waitForCompletion();
}
