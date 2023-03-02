import { keyboard, Key, clipboard } from "@nut-tree/nut-js";

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
	await keyboard.type(Key.LeftControl, Key.LeftShift, Key.Num3);
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
	await keyboard.type(Key.LeftControl, Key.LeftShift, Key.Num3);
}
