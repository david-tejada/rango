import { promiseWrap } from "../../lib/promiseWrap";
import { type RangoActionWithTargets } from "../../typings/RangoAction";
import { getOrCreateWrapper } from "../wrappers/ElementWrapperClass";
import { getLastWrapper } from "../wrappers/lastWrapper";
import { getReferences } from "./references";
import { runRangoActionWithTarget } from "./runRangoActionWithTarget";

function findClosestElement(
	nodeList: NodeListOf<Element>,
	targetElement: Element
) {
	let closestElement = null;
	let minDistance = Number.MAX_VALUE;
	const targetRect = targetElement.getBoundingClientRect();

	for (const currentElement of nodeList) {
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

async function getElementFromSelector(selector: string, maxWait: number) {
	return new Promise((resolve: (element: Element) => void, reject) => {
		const elements = document.querySelectorAll(selector);

		if (elements.length === 1) {
			resolve(elements[0]!);
		}

		if (elements.length > 1) {
			const lastWrapper = getLastWrapper();
			const element = lastWrapper
				? findClosestElement(elements, lastWrapper.element)!
				: elements[0]!;
			resolve(element);
		}

		const timeout = setTimeout(() => {
			reject(new Error("Timed out waiting for element matching selector."));
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

export async function runActionOnReference(
	type: RangoActionWithTargets["type"],
	name: string
) {
	const { hostReferences } = await getReferences();
	const selector = hostReferences.get(name)!;

	if (!selector) {
		return false;
	}

	const [element] = await promiseWrap<Element>(
		getElementFromSelector(selector, 1000)
	);

	if (!element) {
		return false;
	}

	const wrapper = getOrCreateWrapper(element, false);
	await runRangoActionWithTarget({ type, target: [] }, [wrapper]);
	return true;
}
