import { z } from "zod";
import type { Command } from "../../typings/Command";
import type { TalonAction } from "../../typings/TalonAction";
import { readClipboard, writeClipboard } from "./clipboard";

let shouldDiscardNextResponse = false;

const zRequest = z
	.object({
		version: z.number(),
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

		const command = result.data as Command;

		return command;
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
export async function writeResponse(
	talonActions: TalonAction | TalonAction[] = []
) {
	if (shouldDiscardNextResponse) {
		shouldDiscardNextResponse = false;
		return;
	}

	const actions = Array.isArray(talonActions) ? talonActions : [talonActions];

	const isFocusPageAndResendResponse = actions.some(
		(action) => action.name === "focusPageAndResend"
	);
	if (isFocusPageAndResendResponse) assertFirstFocusPageAndResend();

	const jsonResponse = JSON.stringify({ type: "response", actions });
	await writeClipboard(jsonResponse);
}

export function discardNextResponse() {
	shouldDiscardNextResponse = true;
}

// This avoids creating an infinite loop if Talon isn't able to focus the page.
let hasTriedToFocusPage = false;
function assertFirstFocusPageAndResend() {
	if (hasTriedToFocusPage) {
		throw new Error("Command execution failed. Unable to focus page.");
	}

	hasTriedToFocusPage = true;
	setTimeout(() => {
		hasTriedToFocusPage = false;
	}, 1000);
}
