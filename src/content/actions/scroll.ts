import { getIntersectorWithHint } from "../intersectors";

let scrollContainer: Element | undefined;

// eslint-disable-next-line @typescript-eslint/ban-types
function getScrollContainer(node: Node | null): Element | undefined {
	if (node instanceof Element) {
		if (
			node.scrollHeight > node.clientHeight &&
			(window.getComputedStyle(node).overflowY === "auto" ||
				window.getComputedStyle(node).overflowY === "scroll")
		) {
			return node;
		}

		if (node.parentNode) {
			return getScrollContainer(node.parentNode);
		}
	}

	return undefined;
}

function scrollVertically(
	scrollContainer: HTMLElement,
	direction: "up" | "down"
) {
	const previousScrollBehavior =
		window.getComputedStyle(scrollContainer).scrollBehavior;
	scrollContainer.style.scrollBehavior = "auto";
	const scrollHeight = Math.min(
		scrollContainer.clientHeight,
		document.documentElement.clientHeight
	);
	const scrollAmount =
		direction === "up" ? (-scrollHeight * 2) / 3 : (scrollHeight * 2) / 3;
	scrollContainer.scrollBy({ left: 0, top: scrollAmount, behavior: "auto" });
	scrollContainer.style.scrollBehavior = previousScrollBehavior;
}

export function scrollVerticallyAtElement(
	direction: "up" | "down",
	hint?: string
) {
	if (hint) {
		const element = getIntersectorWithHint(hint).element;
		scrollContainer = getScrollContainer(element);
	}

	if (!scrollContainer) {
		scrollPageVertically(direction);
	}

	if (scrollContainer && scrollContainer instanceof HTMLElement) {
		scrollVertically(scrollContainer, direction);
	}
}

export function scrollPageVertically(direction: "up" | "down") {
	const scrollContainer =
		document.documentElement.clientHeight ===
		document.documentElement.scrollHeight
			? document.body
			: document.documentElement;

	scrollVertically(scrollContainer, direction);
}
