export function getEventListeners() {
	if ("_addEventListener" in Element.prototype) {
		return;
	}

	window.addEventListener(
		"message",
		({ data }: { data: { type: string; selector: string } }) => {
			if (data.type === "checkIfElementHasClickListeners") {
				const element = document.querySelector(data.selector);

				if (!element) {
					return;
				}

				const listeners = element.getEventListeners();
				if (listeners && ("click" in listeners || "mousedown" in listeners)) {
					window.postMessage(
						{
							type: "elementHasClickListeners",
							selector: data.selector,
						},
						window.location.origin
					);
				}
			}
		}
	);

	// Save the original methods before overwriting them
	Element.prototype._addEventListener = Element.prototype.addEventListener;
	Element.prototype._removeEventListener =
		Element.prototype.removeEventListener;

	Element.prototype.addEventListener = function <
		K extends keyof ElementEventMap
	>(type: K, listener: EventListener, useCapture = false): void {
		// Declare listener
		this._addEventListener(type, listener, useCapture);

		if (!this.eventListenerList) this.eventListenerList = {};
		if (!this.eventListenerList[type]) this.eventListenerList[type] = [];

		// Add listener to  event tracking list
		const listeners = this.eventListenerList[type];
		if (listeners) {
			listeners.push({ listener, useCapture });
		}
	};

	Element.prototype.removeEventListener = function <
		K extends keyof ElementEventMap
	>(
		type: K,
		listener: (this: Element, ev: ElementEventMap[K]) => any,
		useCapture = false
	): void {
		// Remove listener
		this._removeEventListener(type, listener, useCapture);

		if (!this.eventListenerList) {
			this.eventListenerList = {};
		}

		if (!this.eventListenerList[type]) {
			this.eventListenerList[type] = [];
		}

		// Find the event in the list, If a listener is registered twice, one
		// with capture and one without, remove each one separately. Removal of
		// a capturing listener does not affect a non-capturing version of the
		// same listener, and vice versa.
		const listenerList = this.eventListenerList[type];
		if (listenerList) {
			for (let i = 0; i < listenerList.length; i++) {
				const item = listenerList[i];
				if (
					item &&
					item.listener === listener &&
					item.useCapture === useCapture
				) {
					listenerList.splice(i, 1);
					break;
				}
			}

			// If no more events of the removed event type are left,remove the group
			if (listenerList.length === 0) {
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				delete this.eventListenerList[type];
			}
		}
	};

	Element.prototype.getEventListeners = function (type) {
		if (!this.eventListenerList) {
			this.eventListenerList = {};
		}

		// Return reqested listeners type or all them
		if (type === undefined) {
			return this.eventListenerList;
		}

		return this.eventListenerList[type];
	};
}
