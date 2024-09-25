import type Color from "color";

export type Hint = {
	/**
	 * The Element the hint is referencing.
	 */
	target: Element;
	shadowHost: HTMLDivElement;
	isActive: boolean;
	outer: HTMLDivElement;
	inner: HTMLDivElement;
	container: HTMLElement | ShadowRoot;
	limitParent: HTMLElement;
	availableSpaceLeft?: number;
	availableSpaceTop?: number;
	wrapperRelative?: boolean;
	elementToPositionHint: Element | SVGElement | Text;
	zIndex?: number;
	positioned: boolean;
	toBeReattached: boolean;
	wasReattached: boolean;
	color: Color;
	backgroundColor: Color;
	borderColor: Color;
	borderWidth: number;
	keyEmphasis?: boolean;
	freezeColors?: boolean;
	firstTextNodeDescendant?: Text;
	string?: string;

	// Methods
	setBackgroundColor(color?: string): void;
	computeHintContext(): void;
	computeColors(): void;
	updateColors(): void;
	claim(): string | undefined;
	position(): void;
	flash(ms?: number): void;
	clearFlash(): void;

	/**
	 * Releases a hint and removes it from hintedWrappers.
	 *
	 * @param returnToStack Return the hint string to the stack to be reused again. Default is `true`.
	 * @param removeElement Remove the hint element from the DOM. Default is `true`.
	 * @returns
	 */
	release(keepInCache?: boolean, removeElement?: boolean): void;
	hide(): void;
	show(): void;
	reattach(): void;
	applyDefaultStyle(): void;
	keyHighlight(): void;
	clearKeyHighlight(): void;
};
