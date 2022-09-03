import { ResponseToTalon } from "../../typings/RequestFromTalon";
import { adaptResponse } from "../utils/adaptResponse";
import {
	getRequestFromClipboard,
	writeResponseToClipboard,
} from "../utils/clipboard";
import { noActionResponse } from "../utils/responseObjects";
import { dispatchCommand } from "./dispatchCommand";
import { isUnintendedDirectClicking } from "./isUnintendedDirectClicking";

export async function handleTalonRequest() {
	try {
		const request = await getRequestFromClipboard();
		if (process.env["NODE_ENV"] !== "production") {
			console.log(JSON.stringify(request, null, 2));
		}

		if (!request) {
			return;
		}

		// We check first if the user intended to type instead of direct clicking
		if (await isUnintendedDirectClicking(request.action)) {
			const response: ResponseToTalon = {
				type: "response",
				action: {
					type: "noHintFound",
				},
			};

			const adaptedResponse = adaptResponse(response, request.version ?? 0);
			await writeResponseToClipboard(adaptedResponse);
			return;
		}

		// If we are dealing with a copy command we first send the command and store
		// the response to send back to talon
		if (request.action.type.startsWith("copy")) {
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
