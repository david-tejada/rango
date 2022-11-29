import { ElementWrapper } from "../../typings/ElementWrapper";
import { dispatchUnhover } from "../utils/dispatchEvents";

const hoveredElements: Set<Element> = new Set();

export async function hoverElement(wrappers: ElementWrapper[]) {
	unhoverAll();
	for (const wrapper of wrappers) {
		hoveredElements.add(wrapper.hover());
	}
}

export function unhoverAll() {
	for (const hoveredElement of hoveredElements) {
		dispatchUnhover(hoveredElement);
	}

	hoveredElements.clear();
}
