import type {
	RequestFromTalon,
	ResponseToTalon,
} from "../../typings/RequestFromTalon";
import { readClipboard, writeClipboard } from "./clipboard";
import { notify } from "./notify";

/**
 * Reads and parses the request from the clipboard.
 */
export async function getRequest(): Promise<RequestFromTalon | undefined> {
	const clipText = await readClipboard();
	let request: RequestFromTalon;

	if (clipText) {
		try {
			request = JSON.parse(clipText) as RequestFromTalon;
			// This is just to be extra safe
			if (request.type !== "request") {
				console.error(
					'Error: The message present in the clipboard is not of type "request"'
				);
			}

			return request;
		} catch (error: unknown) {
			// We already check that we are sending valid json in rango-talon, but
			// just to be extra sure
			if (error instanceof SyntaxError) {
				console.error(error);
			}
		}
	} else {
		await notify("Unable to read the request present on the clipboard", {
			type: "error",
		});
	}

	return undefined;
}

/**
 * Stringifies and writes the response to the clipboard.
 */
export async function postResponse(response: ResponseToTalon) {
	const jsonResponse = JSON.stringify(response);
	await writeClipboard(jsonResponse);
}
