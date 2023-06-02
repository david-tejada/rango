import { promiseWrap } from "../../lib/promiseWrap";
import {
	getRequestFromClipboard,
	writeResponseToClipboard,
} from "../utils/clipboard";
import { notify } from "../utils/notify";
import { dispatchCommand } from "../commands/dispatchCommand";
import { shouldTryToFocusDocument } from "../utils/shouldTryToFocusDocument";
import { constructTalonResponse } from "../utils/constructTalonResponse";
import { sendRequestToContent } from "./sendRequestToContent";

export async function handleRequestFromTalon() {
	try {
		const request = await getRequestFromClipboard();
		if (process.env["NODE_ENV"] !== "production") {
			console.log(JSON.stringify(request, null, 2));
		}

		if (!request) {
			return;
		}

		if (request.action.type === "directClickElement") {
			// We only need to differentiate between "directClickElement" and
			// "clickElement" when there is only one target as the user might have
			// intended to type those letters
			if (request.action.target.length > 1) {
				request.action.type = "clickElement";
			} else {
				// If no content script is running focusedDocument will be undefined
				const [focusedDocument] = await promiseWrap(
					sendRequestToContent({
						type: "checkIfDocumentHasFocus",
					})
				);

				if (!focusedDocument) {
					await writeResponseToClipboard({
						type: "response",
						action: { type: "noHintFound" },
						actions: [
							{
								name: "typeTargetCharacters",
							},
						],
					});

					return;
				}
			}
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
			await writeResponseToClipboard(response);
			return;
		}

		const response = await dispatchCommand(request.action);
		await writeResponseToClipboard(response);
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error(error);
			await notify(error.message, { type: "error" });
		}
	}
}
