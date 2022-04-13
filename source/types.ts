export interface Message {
	type: "request" | "response";
	action?: {
		type: string;
		target?: string | number;
	};
}

export interface HintConfig {
	text: string;
	clickableType?: ClickableType;
}

export type ClickableType =
	| "button"
	| "a"
	| "input"
	| "summary"
	| "role:button"
	| "role:link"
	| "role:treeitem"
	| "role:tab"
	| "onclick"
	| undefined;

export interface ObservedElement {
	element: Element;
	hintElement?: Element;
	hintText?: string;
	isIntersecting: boolean | undefined;
	isVisible: boolean;
	clickableType: ClickableType;
}

export interface ObservedElementConfig {
	hintElement?: Element | undefined;
	isIntersecting?: boolean;
	updateVisible?: boolean;
	updateClickable?: boolean;
}
