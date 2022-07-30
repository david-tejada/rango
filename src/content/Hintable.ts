import { getElementToAttachHint } from "./hints/getElementToAttachHint";
import { getSuitableHintContainer } from "./hints/getSuitableHintContainer";
import { Hint } from "./hints/Hint";
import { getScrollContainer } from "./utils/getScrollContainer";
import { isClickable } from "./utils/isClickable";
import { isVisible } from "./utils/isVisible";
import { getFirstTextNodeDescendant } from "./utils/nodeUtils";

let idCounter = 0;

export class Hintable {
	element: HTMLElement;
	id: number;
	isClickable: boolean;
	stackContainer: HTMLElement;
	elementToAttachHint: Element;
	scrollContainer: HTMLElement | null;
	isIntersecting?: boolean;
	firstTextNodeDescendant?: Text;
	hint?: Hint;
	willHaveHint?: boolean;

	constructor(element: HTMLElement) {
		this.element = element;
		this.isClickable = isClickable(element);
		this.firstTextNodeDescendant = getFirstTextNodeDescendant(element);
		this.elementToAttachHint = getElementToAttachHint(element);
		this.stackContainer = getSuitableHintContainer(this.elementToAttachHint);
		this.scrollContainer = getScrollContainer(element);
		this.id = idCounter++;
	}

	intersect(isIntersecting: boolean) {
		this.isIntersecting = isIntersecting;

		if (!this.hint && !this.willHaveHint) {
			if (isIntersecting) {
				this.hint = new Hint(this.element, this.stackContainer, this.id);
			} else {
				this.willHaveHint = true;
				window.requestIdleCallback(() => {
					this.willHaveHint = undefined;
					this.hint = new Hint(this.element, this.stackContainer, this.id);
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
