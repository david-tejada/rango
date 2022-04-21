export interface Message {
	type: "request" | "response";
	action?: {
		type: string;
		target?: string | number;
	};
}

export type ClickableType =
	| "button"
	| "a"
	| "input"
	| "textarea"
	| "summary"
	| "role:button"
	| "role:link"
	| "role:treeitem"
	| "role:tab"
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
