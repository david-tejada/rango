const listeners = new Map<
	(...args: any[]) => void | Promise<void>,
	unknown[]
>();

/**
 * Register a listener to be called when the document is visible. If the
 * document is already visible the listener is called immediately.
 */
export function onDocumentVisible<T extends unknown[]>(
	listener: (...args: T) => void | Promise<void>,
	...args: T
) {
	if (document.visibilityState === "visible") {
		void listener(...args);
	} else {
		listeners.set(listener, args);
	}
}

document.addEventListener("visibilitychange", () => {
	if (document.visibilityState === "visible") {
		for (const [listener, args] of listeners) {
			void listener(...args);
		}

		listeners.clear();
	}
});
