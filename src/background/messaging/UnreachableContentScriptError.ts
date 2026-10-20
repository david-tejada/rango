export class UnreachableContentScriptError extends Error {
	constructor(message = "Unable to communicate with content script.") {
		super(message);
		this.name = "UnreachableContentScriptError";
		this.message = message;
	}
}

/**
 * Returns `true` if the browser couldn't reach the content script of the frame
 * we messaged. Unlike `UnreachableContentScriptError`, which means the whole
 * tab is unreachable, this happens when one frame has no content script
 * listening, for example an `about:blank` frame or a page that has just left.
 */
export function isUnreachableFrameError(error: unknown) {
	return (
		error instanceof Error &&
		error.message ===
			"Could not establish connection. Receiving end does not exist."
	);
}
