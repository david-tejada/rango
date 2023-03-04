import { promiseWrap } from "../../lib/promiseWrap";
import { sendRequestToCurrentTab } from "../messaging/sendRequestToCurrentTab";
import {
	getRequestFromClipboard,
	writeResponseToClipboard,
} from "../utils/clipboard";
import { dispatchCommand } from "./dispatchCommand";

export async function handleTalonRequest() {
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
					sendRequestToCurrentTab({
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

		const response = await dispatchCommand(request.action);
		await writeResponseToClipboard(response);
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error(error);
		}
	}
}
