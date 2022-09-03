import Color from "color";

export interface Intersector {
	element: Element;
	scrollContainer?: Element;
	clickableType: string | undefined;
	firstTextNodeDescendant?: Text;
	hintElement?: HTMLDivElement;
	hintText?: string;
	hintAnchorRect?: DOMRect;
	hintAnchorIsText?: boolean;
	hintPlacement?: "top" | "bottom";
	backgroundColor?: Color;
	freezeHintStyle?: boolean;
}

export interface HintedIntersector extends Intersector {
	hintElement: HTMLDivElement;
	hintText: string;
	clickableType: string;
}
