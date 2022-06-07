export class NoHintError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "NoHintError";
	}
}
