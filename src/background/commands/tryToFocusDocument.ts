import { sendMessage } from "../messaging/backgroundMessageBroker";
import { promiseWrap } from "../utils/promises";

/**
 * Tries to focus the Document. Returns a boolean indicating success. True means
 * the Document currently has focus.
 */
export async function tryToFocusDocument(): Promise<boolean> {
	// This only works in Firefox.
	// We can't check if the document has focus on the same message. For whatever
	// reason if you check immediately it always returns false.
	await sendMessage("tryToFocusPage");

	const [documentHasFocus] = await promiseWrap(
		sendMessage("checkIfDocumentHasFocus")
	);

	return Boolean(documentHasFocus);
}
