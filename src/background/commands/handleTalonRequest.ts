import { ResponseToTalon } from "../../typings/RequestFromTalon";
import { adaptResponse } from "../utils/adaptResponse";
import {
	getClipboardIfChanged,
	getRequestFromClipboard,
	writeResponseToClipboard,
} from "../utils/clipboard";
import {
	getCopyToClipboardResponseObject,
	noActionResponse,
} from "../utils/responseObjects";
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

		const requiresResponseValue = request.action.type.startsWith("copy");

		if (navigator.clipboard || requiresResponseValue) {
			let response = await dispatchCommand(request.action);

			if (
				request.action.type === "clickElement" ||
				request.action.type === "directClickElement"
			) {
				const changedClipboard = await getClipboardIfChanged();
				response = changedClipboard
					? getCopyToClipboardResponseObject(changedClipboard)
					: response;
			}

			const adaptedResponse = adaptResponse(response, request.version ?? 0);
			await writeResponseToClipboard(adaptedResponse);
		} else {
			const adaptedResponse = adaptResponse(
				noActionResponse,
				request.version ?? 0
			);
			await writeResponseToClipboard(adaptedResponse);
			// Because of the way I had to implement copying and pasting to the clipboard in Manifest v3,
			// sending a response requires focusing the textarea element dedicated for it, which might
			// close popup elements or have other unintended consequences, therefore I will first send
			// the response back and then execute the command
			await dispatchCommand(request.action);
		}
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error(error);
		}
	}
}
