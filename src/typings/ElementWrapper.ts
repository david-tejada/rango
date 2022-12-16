import Color from "color";
import { BoundedIntersectionObserver } from "../content/BoundedIntersectionObserver";

export interface ElementWrapper {
	readonly element: Element;

	isIntersecting?: boolean;
	isHintable: boolean;
	isActiveFocusable: boolean;
	shouldBeHinted?: boolean;

	// These properties are only needed for hintables
	intersectionObserver?: BoundedIntersectionObserver;
	userScrollableContainer?: HTMLElement;
	effectiveBackgroundColor?: string;
	hint?: HintableMark;

	// Methods
	updateIsHintable(): void;
	updateShouldBeHinted(): void;
	observeIntersection(): void;
	unobserveIntersection(): void;
	intersect(isIntersecting: boolean): void;
	click(): void;
	hover(): Element;
	remove(): void;
}

export interface HintableMark {
	readonly target: Element;
	readonly outer: HTMLDivElement;
	readonly inner: HTMLDivElement;
	container: HTMLElement | ShadowRoot;
	limitParent: HTMLElement;
	availableSpaceLeft?: number;
	availableSpaceTop?: number;
	wrapperRelative?: boolean;
	elementToPositionHint: Element | SVGElement | Text;
	zIndex?: number;
	positioned: boolean;
	color: Color;
	backgroundColor: Color;
	outlineColor: Color;
	outlineWidth: number;
	keyEmphasis?: boolean;
	freezeColors?: boolean;
	firstTextNodeDescendant?: Text;
	string?: string;

	// Methods
	setBackgroundColor(color?: string): void;
	computeHintContext(): void;
	computeColors(): void;
	updateColors(): void;
	position(): void;
	flash(ms?: number): void;
	claim(): string;
	release(keepInCache?: boolean): void;
	reattach(): void;
	applyDefaultStyle(): void;
	keyHighlight(): void;
	clearKeyHighlight(): void;
}
