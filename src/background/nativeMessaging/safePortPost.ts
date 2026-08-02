/**
 * `Port.postMessage()` throws synchronously if the port already disconnected,
 * but `onDisconnect` fires asynchronously — there's a race window where the
 * port reference is truthy but posting to it throws anyway. Ported from
 * Interceptor's `safe-port-post.ts`, which exists for exactly this reason.
 */
export function safePortPost(
	port:
		| { disconnect?: () => void; postMessage(message: unknown): void }
		| undefined,
	message: unknown
): { posted: boolean; error?: string } {
	if (!port) return { posted: false, error: "no port" };

	try {
		port.postMessage(message);
		return { posted: true };
	} catch (error) {
		try {
			port.disconnect?.();
		} catch {
			// Already gone.
		}

		return {
			posted: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}
