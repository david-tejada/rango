import { retrieve } from "../../common/storage";
import { promiseWrap } from "../../lib/promiseWrap";
import { type RequestFromTalon } from "../../typings/RequestFromTalon";
import { dispatchCommand } from "../commands/dispatchCommand";
import { checkActiveElementIsEditable } from "../utils/checkActiveElementIsEditable";
import { constructTalonResponse } from "../utils/constructTalonResponse";
import { getRequest, postResponse } from "../utils/requestAndResponse";
import { shouldTryToFocusDocument } from "../utils/shouldTryToFocusDocument";
import { sendRequestToContent } from "./sendRequestToContent";

let talonIsWaitingForResponse = false;

async function writeTypeCharactersResponse() {
	await postResponse({
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
	const request = await getRequest();
	if (process.env["NODE_ENV"] !== "production") {
		console.log(JSON.stringify(request, null, 2));
	}

	talonIsWaitingForResponse = !(request.action.type === "requestTimedOut");

	if (request.action.type === "requestTimedOut") return;

	if (request.action.type === "directClickElement") {
		const isRequestHandled = await handleDirectClickElementRequest(request);
		if (isRequestHandled) return;
	}

	// For these three actions we need to make sure that the document is focused
	// or they might fail
	if (
		(request.action.type === "setSelectionAfter" ||
			request.action.type === "setSelectionBefore" ||
			request.action.type === "tryToFocusElementAndCheckIsEditable") &&
		(await shouldTryToFocusDocument())
	) {
		const response = constructTalonResponse([{ name: "focusPageAndResend" }]);
		await postResponse(response);
		return;
	}

	const response = await dispatchCommand(request.action);
	if (talonIsWaitingForResponse) {
		await postResponse(response);
		talonIsWaitingForResponse = false;
	}
}
