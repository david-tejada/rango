export interface Message {
	type: "request" | "response";
	action: {
		type: string;
		target?: string | number;
	};
}

export type ClickableType =
	| "button"
	| "a"
	| "input"
	| "textarea"
	| "select"
	| "option"
	| "summary"
	| "role:button"
	| "role:link"
	| "role:treeitem"
	| "role:tab"
	| "role:option"
	| "role:radio"
	| "onclick"
	| undefined;

export interface IntersectingElement {
	element: Element;
	hintElement?: Element;
	hintText?: string;
	isVisible: boolean;
	clickableType: ClickableType;
}

export interface IntersectingElementConfig {
	hintElement?: Element | undefined;
	isIntersecting?: boolean;
	updateVisible?: boolean;
	updateClickable?: boolean;
}

export interface Rgba {
	r: number;
	g: number;
	b: number;
	a: number;
}
