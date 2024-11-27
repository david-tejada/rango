import { getLastTargetedWrapper } from "../wrappers/lastTargetedWrapper";

/**
 * The maximum time to wait for an element matching a selector to appear.
 */
const maxWait = 1000;

/**
 * Get a single element that matches a selector. If the element is not found
 * immediately, it will wait for the element to appear. If multiple elements are
 * found, it will return the closest one (by coordinates) to the last targeted
 * wrapper.
 */
export async function getElementFromSelector(selector: string) {
	return new Promise<Element | null>((resolve) => {
		const elements = document.querySelectorAll(selector);

		if (elements.length === 1) resolve(elements[0]!);

		if (elements.length > 1) {
			const lastWrapper = getLastTargetedWrapper();
			const element = lastWrapper
				? findClosestElementByCoordinates(lastWrapper.element, elements)!
				: elements[0]!;
			resolve(element);
		}

		// When using references for scripting, the user might click several
		// references in a row. Clicking one reference might make another one to
		// appear.
		const timeout = setTimeout(() => {
			resolve(null);
		}, maxWait);

		const observer = new MutationObserver(() => {
			const element = document.querySelector(selector);
			if (element) {
				observer.disconnect();
				clearTimeout(timeout);
				resolve(element);
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	});
}

/**
 * Find the element in a node list that is closest to a target element by
 * coordinates.
 */
function findClosestElementByCoordinates(
	element: Element,
	list: NodeListOf<Element>
) {
	let closestElement = null;
	let minDistance = Number.MAX_VALUE;
	const targetRect = element.getBoundingClientRect();

	for (const currentElement of list) {
		const currentRect = currentElement.getBoundingClientRect();

		// Calculate the distance between the top left points of the elements. We
		// could calculate the distance between the center points but this is
		// simpler and I think it's enough.
		const distance = Math.hypot(
			currentRect.left - targetRect.left,
			currentRect.top - targetRect.top
		);

		if (distance < minDistance) {
			minDistance = distance;
			closestElement = currentElement;
		}
	}

	return closestElement;
}
