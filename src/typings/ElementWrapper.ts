import Color from "color";
import { BoundedIntersectionObserver } from "../content/BoundedIntersectionObserver";

export interface ElementWrapper {
	readonly element: Element;
	readonly clickTarget: Element;

	isIntersecting?: boolean;
	isHintable: boolean;
	shouldBeHinted: boolean;

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
	remove(): void;
}

export interface HintableMark {
	readonly target: Element;
	readonly outer: HTMLDivElement;
	readonly inner: HTMLDivElement;
	container: Element;
	outermostPossibleContainer: Element;
	availableSpaceLeft?: number;
	availableSpaceTop?: number;
	elementToPositionHint: Element | SVGElement | Text;
	zIndex?: number;
	positioned: boolean;
	color: Color;
	backgroundColor: Color;
	freezeColors?: boolean;
	firstTextNodeDescendant?: Text;
	string?: string;

	// Methods
	setBackgroundColor(color?: string): void;
	computeColors(): void;
	updateColors(): void;
	position(): void;
	flash(): void;
	claim(): string;
	release(keepInCache: boolean): void;
	applyDefaultStyle(): void;
	emphasize(): void;
}
