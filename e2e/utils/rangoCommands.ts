/* eslint-disable no-await-in-loop */
import { runTestRequest, storageClipboard } from "./serviceWorker";
import { sleep } from "./testHelpers";

async function waitResponseReady() {
	let message: any;

	while (!message || message.type !== "response") {
		const clip = await storageClipboard.readText();

		try {
			message = JSON.parse(clip) as unknown;
		} catch {
			// Ignore parsing errors
		}

		await sleep(10);
	}
}

// We leave these commands with version 1 for now, that way we are also testing
// the conversion from version 1 to version 2.

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

	const request = JSON.stringify(command);

	await runTestRequest(request);
	await waitResponseReady();
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

	const request = JSON.stringify(command);

	await runTestRequest(request);
	await waitResponseReady();
}
