import { retrieve } from "../../common/storage";
import { promiseWrap } from "../../lib/promiseWrap";
import { type RequestFromTalon } from "../../typings/RequestFromTalon";
import { checkActiveElementIsEditable } from "../utils/checkActiveElementIsEditable";
import { readRequest, writeResponse } from "../utils/requestAndResponse";
import { dispatchCommand } from "../commands/commandEvents";
import { sendRequestToContent } from "./sendRequestToContent";

let talonIsWaitingForResponse = false;

async function writeTypeCharactersResponse() {
	await writeResponse({
		type: "response",
		action: { type: "noHintFound" },
		actions: [
			{
				name: "typeTargetCharacters",
			},
		],
	});
}

/**
 * Resolves with true if the request is handled, otherwise false.
 */
async function handleDirectClickElementRequest(request: RequestFromTalon) {
	if (request.action.type !== "directClickElement") {
		throw new Error(
			"This function is only to be called with a directClickElement request"
		);
	}

	// We don't consider the user might have intended to type when there are more
	// than one target since the connector `and` needs to be used.
	if (request.action.target.length > 1) return false;

	if (!(await retrieve("directClickWithNoFocusedDocument"))) {
		const [focusedDocument] = await promiseWrap(
			sendRequestToContent({
				type: "checkIfDocumentHasFocus",
			}) as Promise<boolean>
		);

		if (!focusedDocument) {
			await writeTypeCharactersResponse();
			return true;
		}
	}

	if (
		!(await retrieve("directClickWhenEditing")) &&
		(await checkActiveElementIsEditable())
	) {
		await writeTypeCharactersResponse();
		return true;
	}

	return false;
}

export async function handleRequestFromTalon() {
	const command = await readRequest();
	console.log(JSON.stringify(command, null, 2));

	const { type: name, ...args } = command.action;

	const commandResult = await dispatchCommand(name, args);

	if (commandResult === "noResponse") return;

	await writeResponse(commandResult ?? []);

	// talonIsWaitingForResponse = !(request.action.type === "requestTimedOut");

	// if (request.action.type === "requestTimedOut") return;

	// if (request.action.type === "directClickElement") {
	// 	const isRequestHandled = await handleDirectClickElementRequest(request);
	// 	if (isRequestHandled) return;
	// }

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

	// const response = await dispatchCommand(request.action);
	// if (talonIsWaitingForResponse) {
	// 	await writeResponse(response);
	// 	talonIsWaitingForResponse = false;
	// }
}
