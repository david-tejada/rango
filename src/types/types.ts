export interface Message {
	type: "request" | "response";
	action?: {
		type: string;
		target?: string | number;
	};
}

export interface Intersector {
	element: Element;
	hintElement?: Element;
	hintText?: string;
	isVisible: boolean;
	clickableType: string | undefined;
}

export interface IntersectorConfig {
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
