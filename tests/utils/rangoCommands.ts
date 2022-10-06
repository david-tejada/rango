import { keyboard, Key, clipboard } from "@nut-tree/nut-js";
import { sleep } from "./testHelpers";

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

	await clipboard.copy(commandString);
	await keyboard.pressKey(Key.LeftControl, Key.LeftShift, Key.Num3);

	// We insert a wait to make sure the command has enough time to be executed
	await sleep(100);
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

	await clipboard.copy(commandString);
	await keyboard.pressKey(Key.LeftControl, Key.LeftShift, Key.Num3);

	// We insert a wait to make sure the command has enough time to be executed
	await sleep(100);
}
