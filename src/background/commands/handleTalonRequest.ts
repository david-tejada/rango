import { adaptResponse } from "../utils/adaptResponse";
import {
	getRequestFromClipboard,
	writeResponseToClipboard,
} from "../utils/clipboard";
import { focusedDocumentInCurrentTab } from "../utils/focusedDocumentInCurrentTab";
import { noActionResponse } from "../utils/responseObjects";
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
			}

			const focusedDocument = await focusedDocumentInCurrentTab();

			if (request.action.target.length === 1 && !focusedDocument) {
				await writeResponseToClipboard(
					adaptResponse(
						{
							type: "response",
							// Technically the action should be something like "noDocumentFocused"
							// or even better "pressKeys" but we leave this for simplicity and
							// backwards compatibility with rango-talon
							action: { type: "noHintFound" },
						},
						request.version ?? 0
					)
				);

				return;
			}
		}

		// If we are dealing with a command that might return a response other than
		// "noAction" we first send the command and store the response to send back
		// to talon
		if (
			request.action.type.startsWith("copy") ||
			((request.action.type === "clickElement" ||
				request.action.type === "directClickElement") &&
				request.action.target.length === 1)
		) {
			const response = await dispatchCommand(request.action);
			const adaptedResponse = adaptResponse(response, request.version ?? 0);

			await writeResponseToClipboard(adaptedResponse);
		} else {
			// If talon isn't waiting for a response value we can send the responds right away
			const adaptedResponse = adaptResponse(
				noActionResponse,
				request.version ?? 0
			);

			await writeResponseToClipboard(adaptedResponse);
			await dispatchCommand(request.action);
		}
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error(error);
		}
	}
}
