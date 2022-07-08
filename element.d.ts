// eslint-disable-next-line no-unused-vars
interface Element {
	_addEventListener: typeof Element.prototype.addEventListener;
	_removeEventListener: typeof Element.prototype.removeEventListener;
	eventListenerList: Record<
		string,
		Array<{
			listener: EventListener;
			useCapture: boolean;
		}>
	>;
	getEventListeners: <K extends keyof ElementEventMap>(
		type?: K
	) =>
		| Array<{
				listener: EventListener;
				useCapture: boolean;
		  }>
		| Record<
				K,
				Array<{
					listener: EventListener;
					useCapture: boolean;
				}>
		  >
		| undefined;
}
