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

export interface ObservedElement {
	node: Element;
	hintNode: Element | undefined;
	isIntersecting: boolean | undefined;
	isVisible: boolean;
	isClickable: boolean;
}

export interface ObservedElementConfig {
	hintNode?: Element | undefined;
	isIntersecting?: boolean;
	isVisible?: boolean;
	isClickable?: boolean;
}
