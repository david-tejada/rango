import { Hint } from "./hints/Hint";
import { getScrollContainer } from "./utils/getScrollContainer";
import { isClickable } from "./utils/isClickable";
import { getFirstTextNodeDescendant } from "./utils/nodeUtils";

function isVisible(element: Element): boolean {
	if (
		window.getComputedStyle(element).visibility === "hidden" ||
		window.getComputedStyle(element).display === "none" ||
		Number.parseFloat(window.getComputedStyle(element).opacity) < 0.1 ||
		Number.parseFloat(window.getComputedStyle(element).width) < 5 ||
		Number.parseFloat(window.getComputedStyle(element).height) < 5
	) {
		return false;
	}

	return true;
}

export class Hintable {
	element: Element;
	isClickable: boolean;
	scrollContainer: Element | null;
	isIntersecting?: boolean;
	firstTextNodeDescendant?: Text;
	hint?: Hint;
	willHaveHint?: boolean;

	constructor(element: Element) {
		this.element = element;
		this.isClickable = isClickable(element);
		this.firstTextNodeDescendant = getFirstTextNodeDescendant(element);
		this.scrollContainer = getScrollContainer(element);
	}

	intersect(isIntersecting: boolean) {
		this.isIntersecting = isIntersecting;

		if (!this.hint) {
			if (isIntersecting) {
				this.hint = new Hint(this.element, this.scrollContainer);
			} else if (!this.willHaveHint) {
				// this.willHaveHint = true;
				// window.requestIdleCallback(() => {
				// 	this.willHaveHint = undefined;
				// 	this.hint = new Hint(this.element, this.scrollContainer);
				// });
			}
		}

		if (
			this.hint &&
			this.isClickable &&
			isIntersecting &&
			isVisible(this.element)
		) {
			this.hint.claim();
		} else {
			this.hint?.release();
		}
	}

	update() {
		this.isClickable = isClickable(this.element);
		if (this.isClickable && this.isIntersecting && isVisible(this.element)) {
			// this.hint?.setBackgroundColor();
			this.hint?.position();
			this.hint?.claim();
		} else {
			this.hint?.release();
		}
	}
}
