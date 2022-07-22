import { isLabelledElement } from "../typings/TypingUtils";
import { Hintable } from "./Hintable";
import { hintables } from "./hints/hintables";

export function onIntersection(element: Element, isIntersecting: boolean) {
	const hintable = hintables.get(element) ?? new Hintable(element);
	hintable?.intersect(isIntersecting);

	// console.debug(
	// 	hintables
	// 		.getAll({ intersecting: true, clickable: true })
	// 		.map((hintable) => ({
	// 			letters: hintable.hint?.element.textContent,
	// 			element: hintable.element,
	// 			hint: hintable.hint?.element,
	// 		}))
	// );
}

export function onAttributeMutation(element: Element) {
	const hintable = hintables.get(element);

	if (hintable) {
		hintable.update();
	}

	if (isLabelledElement(element)) {
		const elementLabels = element.labels ?? [];
		for (const label of elementLabels) {
			hintables.get(label)?.update();
		}
	}

	// for (const hintable of hintables.getAll({
	// 	intersecting: true,
	// 	clickable: true,
	// })) {
	// 	if (element.contains(hintable.element)) {
	// 		console.debug("Updating from attribute mutation");
	// 		hintable.update();
	// 	}
	// }
}
