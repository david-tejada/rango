export function isValidMessage(
	message: unknown
): message is { messageId: string; data: Record<string, unknown> | undefined } {
	return (
		typeof message === "object" &&
		message !== null &&
		"messageId" in message &&
		typeof message.messageId === "string" &&
		"data" in message &&
		(typeof message.data === "object" || message.data === undefined)
	);
}
