export interface Message {
	type: "request" | "response";
	action?: {
		type: string;
		target?: string;
	};
}

export interface Intersector {
	element: Element;
	hintElement?: Element;
	hintText?: string;
	isVisible: boolean;
	clickableType: string | undefined;
}

export interface Rgba {
	r: number;
	g: number;
	b: number;
	a: number;
}

export type HintsStacks = Record<
	number,
	{
		free: string[];
		assigned: Map<string, number>;
	}
>;
