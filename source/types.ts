export interface Message {
	type: "request" | "response";
	action?: {
		type: string;
		target?: string | number;
	};
}

export interface Hint {
	element: HTMLElement;
	hintNode: HTMLElement;
	text: number;
}
