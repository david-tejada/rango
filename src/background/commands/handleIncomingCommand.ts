import { UnreachableContentScriptError } from "../messaging/backgroundMessageBroker";
import { handleCommand } from "./commandBroker";
import { readRequest, writeResponse } from "./requestAndResponse";
import { upgradeCommand } from "./upgradeCommand";

export async function handleIncomingCommand() {
	try {
		const commandV1V2 = await readRequest();
		const command = upgradeCommand(commandV1V2);

		// Log the Command to the background script console.
		console.log(JSON.stringify(command, null, 2));

		const { name, ...args } = command.action;

		const commandResult = await handleCommand(name, args);
		if (commandResult !== "noResponse") {
			await writeResponse(commandResult ?? []);
		}
	} catch (error: unknown) {
		if (error instanceof UnreachableContentScriptError) {
			// Rethrow the error with a more descriptive message.
			const message =
				"Unable to run command. This command can't run on browser system pages (settings, new tabs, extensions, or other privileged pages).";
			await writeResponse({ name: "throwError", message });
			throw new UnreachableContentScriptError(message);
		}

		if (error instanceof Error) {
			await writeResponse({ name: "throwError", message: error.message });
		}

		throw error;
	}
}
