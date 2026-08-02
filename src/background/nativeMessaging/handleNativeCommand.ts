import type { ActionMap } from "../../typings/Action";
import { handleCommand } from "../commands/commandHandler";
import { UnreachableContentScriptError } from "../messaging/UnreachableContentScriptError";

export type IncomingRequest = {
	id: string;
	action: { [key: string]: unknown; name: string };
};

export type OutgoingResponse =
	| { id: string; success: true; data?: unknown }
	| { id: string; success: false; error: string };

export function isIncomingRequest(value: unknown): value is IncomingRequest {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as { id?: unknown }).id === "string" &&
		typeof (value as { action?: unknown }).action === "object" &&
		(value as { action?: unknown }).action !== null &&
		typeof (value as { action: { name?: unknown } }).action.name === "string"
	);
}

/**
 * Bridges a native-messaging request into Rango's existing command
 * dispatcher — the same `handleCommand()` the clipboard/Talon transport
 * already uses — and translates the result back into the daemon's response
 * envelope instead of a clipboard-written `TalonAction[]`.
 */
export async function handleNativeCommand(
	request: IncomingRequest
): Promise<OutgoingResponse> {
	const { id, action } = request;
	const { name, ...args } = action;

	try {
		const result = await handleCommand(
			name as keyof ActionMap,
			args as ActionMap[keyof ActionMap]
		);

		if (result === "noResponse") return { id, success: true };
		return { id, success: true, data: result };
	} catch (error: unknown) {
		if (error instanceof UnreachableContentScriptError) {
			return { id, success: false, error: error.message };
		}

		return {
			id,
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}
