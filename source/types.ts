export interface Message {
	type: "request" | "response";
	action?: {
		type: string;
		target?: string | number;
	};
}

export interface Hint {
	type: string | undefined;
	element: HTMLElement;
	elementTextContent: string | undefined;
	hintNode: HTMLElement;
	text: number;
}
