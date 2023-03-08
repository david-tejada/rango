/* eslint-disable no-await-in-loop */
import { keyboard, Key, clipboard, sleep } from "@nut-tree/nut-js";

async function waitForCompletion() {
	let message: any;

	while (!message || message.type !== "response") {
		const clip = await clipboard.getContent();

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

	await clipboard.setContent(commandString);
	await keyboard.type(Key.LeftControl, Key.LeftShift, Key.Num3);
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

	await clipboard.setContent(commandString);
	await keyboard.type(Key.LeftControl, Key.LeftShift, Key.Num3);
	await waitForCompletion();
}
