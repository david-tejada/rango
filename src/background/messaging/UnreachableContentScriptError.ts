export class UnreachableContentScriptError extends Error {
	constructor(message = "Unable to communicate with content script.") {
		super(message);
		this.name = "UnreachableContentScriptError";
		this.message = message;
	}
}
