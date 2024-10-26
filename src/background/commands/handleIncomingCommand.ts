import { UnreachableContentScriptError } from "../messaging/backgroundMessageBroker";
import { readRequest, writeResponse } from "../utils/requestAndResponse";
import { handleCommand } from "./commandBroker";

export async function handleIncomingCommand() {
	try {
		const command = await readRequest();
		const { type: name, ...args } = command.action;

		const commandResult = await handleCommand(name, args);
		if (commandResult !== "noResponse") {
			await writeResponse(commandResult ?? []);
		}
	} catch (error: unknown) {
		if (error instanceof UnreachableContentScriptError) {
			// Rethrow the error with a more descriptive message.
			const message =
				"Unable to run command. This command can't run on browser system pages (settings, new tabs, extensions, or other privileged pages).";
			await writeResponse([{ name: "printError", message }]);
			throw new UnreachableContentScriptError(message);
		}

		if (error instanceof Error) {
			await writeResponse([{ name: "printError", message: error.message }]);
		}

		throw error;
	}

	// // For these three actions we need to make sure that the document is focused
	// // or they might fail
	// if (
	// 	(request.action.type === "setSelectionAfter" ||
	// 		request.action.type === "setSelectionBefore" ||
	// 		request.action.type === "tryToFocusElementAndCheckIsEditable") &&
	// 	(await shouldTryToFocusDocument())
	// ) {
	// 	const response = constructTalonResponse([{ name: "focusPageAndResend" }]);
	// 	await writeResponse(response);
	// 	return;
	// }
}
