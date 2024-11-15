export class TargetError extends Error {
	constructor(message: string) {
		// We add this tag to be able to check the type error the background script.
		super("[TargetError] " + message);
		this.name = "TargetError";
	}
}

export function isTargetError(error: unknown) {
	return error instanceof Error && error.message.startsWith("[TargetError]");
}
