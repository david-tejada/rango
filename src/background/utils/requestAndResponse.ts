import { z } from "zod";
import type { TalonAction } from "../../typings/RequestFromTalon";
import type { Command } from "../../typings/Command";
import { readClipboard, writeClipboard } from "./clipboard";

const zRequest = z
	.object({
		version: z.literal(1),
		type: z.literal("request"),
		action: z.object({ type: z.any() }).passthrough(),
	})
	.passthrough();

/**
 * Reads and parses the request from the clipboard.
 */
export async function readRequest() {
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
		const parsedJson = JSON.parse(clipText) as unknown;
		const result = zRequest.safeParse(parsedJson);

		if (result.error) {
			throw new Error("Clipboard content is not a valid request.");
		}

		return result.data as Command;
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
export async function writeResponse(actions: TalonAction[] = []) {
	const jsonResponse = JSON.stringify({ type: "response", actions });
	await writeClipboard(jsonResponse);
}
