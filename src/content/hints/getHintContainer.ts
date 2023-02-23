import { assertDefined } from "../../typings/TypingUtils";
import { isUserScrollable } from "../utils/cssomUtils";
import { getCachedStyle } from "./layoutCache";

declare global {
	interface CSSStyleDeclaration {
		contentVisibility?: string;
	}
}

function getClosestHtmlElement(element: Element) {
	let current: Element | null = element;

	while (current && !(current instanceof HTMLElement)) {
		current = current.parentElement;
	}

	return current;
}

function getOutermostOffsetParent(origin: Element, limit: HTMLElement) {
	// We need to call this function first since only HTMLElement(s) can have
	// offsetParent(s)
	let htmlElement = getClosestHtmlElement(origin);
	let current = htmlElement ? htmlElement.offsetParent : null;
	let candidate;

	while (current && limit.contains(current)) {
		if (current instanceof HTMLElement) candidate = current;
		htmlElement = getClosestHtmlElement(current);
		current = htmlElement ? htmlElement.offsetParent : null;
	}

	return candidate?.shadowRoot ? candidate.shadowRoot : candidate;
}

export function getHintContainer(element: Element) {
	// Last possible ancestor to place the hint;
	let limitParent;

	// If the hintable itself is sticky or fixed we need to place the hint inside
	// it or it will jump up and down when scrolling
	const { position, display } = getCachedStyle(element);
	let current =
		position === "sticky" || position === "fixed"
			? element
			: element.parentNode;

	while (current) {
		if (current instanceof ShadowRoot) {
			current = current.host;
			continue;
		}

		if (!(current instanceof HTMLElement)) {
			current = current.parentNode;
			continue;
		}

		if (current.tagName === "DETAILS" || display === "contents") {
			current = current.parentNode;
			continue;
		}

		const { position, transform, willChange } = getCachedStyle(current);

		if (
			current === document.body ||
			position === "fixed" ||
			position === "sticky" ||
			transform !== "none" ||
			willChange === "transform" ||
			isUserScrollable(current)
		) {
			limitParent = current;
			break;
		}

		current = current.parentNode;
	}

	// At this point limitParent has to be defined but we place this check here to
	// please the linter
	assertDefined(limitParent);

	return getOutermostOffsetParent(element, limitParent) ?? limitParent;
}
