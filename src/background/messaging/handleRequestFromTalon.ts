import { dispatchCommand } from "../commands/commandEvents";
import { readRequest, writeResponse } from "../utils/requestAndResponse";

export async function handleRequestFromTalon() {
	const command = await readRequest();
	console.log(JSON.stringify(command, null, 2));

	const { type: name, ...args } = command.action;

	const commandResult = await dispatchCommand(name, args);

	if (commandResult === "noResponse") return;

	await writeResponse(commandResult ?? []);

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
