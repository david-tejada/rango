/* eslint-disable no-await-in-loop */
import { storageClipboard, runTestRequest } from "./serviceWorker";
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
