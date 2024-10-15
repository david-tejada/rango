import type {
	RequestFromTalon,
	ResponseToTalon,
} from "../../typings/RequestFromTalon";
import { readClipboard, writeClipboard } from "./clipboard";

/**
 * Reads and parses the request from the clipboard.
 */
export async function getRequest() {
	const clipText = await readClipboard();

	if (clipText === "") {
		throw new Error(
			"Clipboard content is not a valid request. Clipboard is empty."
		);
	}

	if (clipText === undefined) {
		throw new Error("Unable to read clipboard content.");
	}

	try {
		const request = JSON.parse(clipText) as RequestFromTalon;

		if (request.type !== "request") {
			throw new Error("Clipboard content is not a valid request.");
		}

		return request;
	} catch (error: unknown) {
		// We already check that we are sending valid json in rango-talon, but
		// just to be extra sure
		if (error instanceof SyntaxError) {
			throw new SyntaxError("Clipboard content is not valid JSON.");
		}

		throw new Error("Unable to read clipboard content.");
	}
}

/**
 * Stringifies and writes the response to the clipboard.
 */
export async function postResponse(response: ResponseToTalon) {
	const jsonResponse = JSON.stringify(response);
	await writeClipboard(jsonResponse);
}
