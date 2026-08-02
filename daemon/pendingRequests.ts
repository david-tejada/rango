import type { ExtensionToDaemonResponse } from "../shared/protocol";

type Pending = {
	resolve: (response: ExtensionToDaemonResponse) => void;
	timer: ReturnType<typeof setTimeout>;
};

/**
 * Correlates outgoing daemon->extension requests with their responses by id,
 * with a per-request timeout. Native messaging (unlike Rango's old single-slot
 * clipboard channel) supports genuine concurrency, so responses can't just be
 * assumed to match the most recent request.
 */
export class PendingRequests {
	private readonly pending = new Map<string, Pending>();

	constructor(private readonly timeoutMs: number) {}

	register(id: string): Promise<ExtensionToDaemonResponse> {
		return new Promise((resolve) => {
			const timer = setTimeout(() => {
				this.pending.delete(id);
				resolve({
					id,
					success: false,
					error: "Timed out waiting for a response from the extension.",
				});
			}, this.timeoutMs);

			this.pending.set(id, { resolve, timer });
		});
	}

	resolve(response: ExtensionToDaemonResponse): boolean {
		const entry = this.pending.get(response.id);
		if (!entry) return false;

		clearTimeout(entry.timer);
		this.pending.delete(response.id);
		entry.resolve(response);
		return true;
	}

	rejectAll(error: string) {
		for (const [id, entry] of this.pending) {
			clearTimeout(entry.timer);
			entry.resolve({ id, success: false, error });
		}

		this.pending.clear();
	}

	get size() {
		return this.pending.size;
	}
}
