import { getElementToPositionHint } from "./hints/getElementToPositionHint";
import { getSuitableHintContainer } from "./hints/getSuitableHintContainer";
import { Hint } from "./hints/Hint";
import { getScrollContainer } from "./utils/getScrollContainer";
import { isClickable } from "./utils/isClickable";
import { isVisible } from "./utils/isVisible";
import { getFirstTextNodeDescendant } from "./utils/nodeUtils";

export class Hintable {
	element: HTMLElement;

	isIntersecting?: boolean;
	isClickable: boolean;
	isVisible: boolean;

	hintContainer: HTMLElement;
	elementToPositionHint: Element;
	scrollContainer: HTMLElement | null;
	firstTextNodeDescendant?: Text;
	hint?: Hint;
	willHaveHint?: boolean;

	constructor(element: HTMLElement) {
		this.element = element;
		this.isClickable = isClickable(element);
		this.isVisible = isVisible(element);
		this.firstTextNodeDescendant = getFirstTextNodeDescendant(element);
		this.elementToPositionHint = getElementToPositionHint(element);
		this.hintContainer = getSuitableHintContainer(this.elementToPositionHint);
		this.scrollContainer = getScrollContainer(element);
	}

	intersect(isIntersecting: boolean) {
		this.isIntersecting = isIntersecting;

		if (!this.hint && !this.willHaveHint) {
			if (isIntersecting) {
				this.hint = new Hint(this.element, this.hintContainer);
			} else {
				this.willHaveHint = true;
				window.requestIdleCallback(() => {
					this.willHaveHint = undefined;
					this.hint = new Hint(this.element, this.hintContainer);
				});
			}
		}

		if (
			this.hint &&
			this.isClickable &&
			isIntersecting &&
			isVisible(this.element)
		) {
			this.hint.claim();
			this.hint?.position();
		} else {
			this.hint?.release();
		}
	}

	update() {
		this.isClickable = isClickable(this.element);
		const elementIsVisible = isVisible(this.element);

		if (this.isClickable && this.isIntersecting && elementIsVisible) {
			// this.hint?.setBackgroundColor();
			this.hint?.claim();
			this.hint?.position();
		} else {
			// If the hintable is still intersecting we need to keep the hint in the cache
			this.isIntersecting ? this.hint?.release(true) : this.hint?.release();
		}
	}
}
