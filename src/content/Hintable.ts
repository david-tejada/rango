import { Hint } from "./hints/Hint";
import { getStackContainer } from "./utils/getStackContainer";
import { isClickable } from "./utils/isClickable";
import { getFirstTextNodeDescendant } from "./utils/nodeUtils";

let idCounter = 0;

function isVisible(element: Element): boolean {
	const style = window.getComputedStyle(element);
	if (
		style.visibility === "hidden" ||
		style.display === "none" ||
		Number.parseFloat(style.opacity) < 0.1 ||
		Number.parseFloat(style.width) < 5 ||
		Number.parseFloat(style.height) < 5
	) {
		return false;
	}

	return true;
}

export class Hintable {
	element: Element;
	id: number;
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
		this.scrollContainer = getStackContainer(element);
		this.id = idCounter++;
	}

	intersect(isIntersecting: boolean) {
		this.isIntersecting = isIntersecting;

		if (!this.hint && !this.willHaveHint) {
			if (isIntersecting) {
				this.hint = new Hint(this.element, this.scrollContainer, this.id);
			} else {
				this.willHaveHint = true;
				window.requestIdleCallback(() => {
					this.willHaveHint = undefined;
					this.hint = new Hint(this.element, this.scrollContainer, this.id);
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
