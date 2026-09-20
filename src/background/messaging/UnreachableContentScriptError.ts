export class UnreachableContentScriptError extends Error {
	constructor(message = "Unable to communicate with content script.") {
		super(message);
		this.name = "UnreachableContentScriptError";
		this.message = message;
	}
}

/**
 * Returns `true` if the error means the frame we were messaging isn't there.
 *
 * `sendMessage` only wraps the error in `UnreachableContentScriptError` when
 * the whole tab is unreachable, which is what `pingContentScript` checks. When
 * the tab is alive but the particular frame has gone away, which happens
 * whenever a frame is removed mid navigation, the browser throws its own
 * "Could not establish connection" error instead.
 */
export function isUnreachableFrameError(error: unknown) {
	return (
		error instanceof UnreachableContentScriptError ||
		(error instanceof Error &&
			/could not establish connection|receiving end does not exist|message manager disconnected/i.test(
				error.message
			))
	);
}
