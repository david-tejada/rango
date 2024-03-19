import { BoundedIntersectionObserver } from "../content/utils/BoundedIntersectionObserver";
import { Hint } from "./Hint";

/**
 * A wrapper for a DOM Element.
 *
 * The reason for having this interface instead of just the class ElementWrapperClass
 * is to avoid cycle dependencies since ElementWrapperClass must import other modules
 * that also import ElementWrapper.
 */
export interface ElementWrapper {
	element: Element;

	isIntersecting?: boolean;
	observingIntersection?: boolean;
	isIntersectingViewport?: boolean;
	isActiveEditable: boolean;
	isHintable: boolean;
	shouldBeHinted?: boolean;

	// These properties are only needed for hintables
	intersectionObserver?: BoundedIntersectionObserver;
	userScrollableContainer?: Element;
	effectiveBackgroundColor?: string;
	hint?: Hint;

	// Methods
	updateIsHintable(): void;
	updateShouldBeHinted(): void;
	observeIntersection(): void;
	unobserveIntersection(): void;
	intersect(isIntersecting: boolean): void;
	intersectViewport(isIntersecting: boolean): void;
	click(): boolean;
	hover(): void;
	unhover(): void;

	/**
	 * Removes the wrapped Element from all the observers. Resets its properties
	 * `shouldBeHinted` and `isIntersectingViewport` to undefined. If the element
	 * has a Hint it releases it.
	 *
	 * This method should be called when the element is removed from the DOM.
	 */
	suspend(): void;
}
