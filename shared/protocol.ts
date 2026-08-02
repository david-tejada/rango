/**
 * Wire protocol between the rango daemon and the extension's native-messaging
 * leg. Mirrors the request/response shape Rango's clipboard transport already
 * uses (`action: {name, ...args}` -> `TalonAction[]`), plus an `id` for
 * request/response correlation, which the single-slot clipboard channel never
 * needed but a native-messaging port (genuinely concurrent) does.
 */

export type CommandAction = {
	name: string;
	[key: string]: unknown;
};

export type DaemonToExtensionRequest = {
	id: string;
	action: CommandAction;
};

export type ExtensionToDaemonResponse =
	| { id: string; success: true; data?: unknown }
	| { id: string; success: false; error: string };

export function isDaemonRequest(
	value: unknown
): value is DaemonToExtensionRequest {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as { id?: unknown }).id === "string" &&
		typeof (value as { action?: unknown }).action === "object" &&
		(value as { action?: unknown }).action !== null &&
		typeof (value as { action: { name?: unknown } }).action.name === "string"
	);
}

export function isExtensionResponse(
	value: unknown
): value is ExtensionToDaemonResponse {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as { id?: unknown }).id === "string" &&
		typeof (value as { success?: unknown }).success === "boolean"
	);
}
