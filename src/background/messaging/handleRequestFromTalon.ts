import { dispatchCommand } from "../commands/commandEvents";
import { notify } from "../utils/notify";
import { readRequest, writeResponse } from "../utils/requestAndResponse";
import { UnreachableContentScriptError } from "./backgroundMessageBroker";

export async function handleRequestFromTalon() {
	const command = await readRequest();
	console.log(JSON.stringify(command, null, 2));

	const { type: name, ...args } = command.action;

	try {
		const commandResult = await dispatchCommand(name, args);

		if (commandResult === "noResponse") return;

		await writeResponse(commandResult ?? []);
	} catch (error: unknown) {
		if (!(error instanceof UnreachableContentScriptError)) {
			throw error;
		}

		console.error(error);
		const message =
			"Unreachable content script error: The command issued is not able to run in the current page.";
		await notify(message, { type: "error" });
		await writeResponse([{ name: "printError", message }]);
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
