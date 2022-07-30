import { isLabelledElement } from "../typings/TypingUtils";
import { Hintable } from "./Hintable";
import { hintables } from "./hints/hintables";

export function onIntersection(element: Element, isIntersecting: boolean) {
	const hintable = hintables.get(element) ?? new Hintable(element);
	hintable?.intersect(isIntersecting);
}

export function onAttributeMutation(element: Element) {
	hintables.updateTree(element);

	if (isLabelledElement(element)) {
		const elementLabels = element.labels ?? [];
		for (const label of elementLabels) {
			hintables.get(label)?.update();
		}
	}
}
