import { ElementWrapper } from "../../typings/ElementWrapper";
import { getHintedWrappers } from "../wrappers/wrappers";

export async function hoverElement(wrappers: ElementWrapper[]) {
	unhoverAll();
	for (const wrapper of wrappers) {
		wrapper.hover();
	}
}

export function unhoverAll() {
	for (const wrapper of getHintedWrappers()) {
		wrapper.unhover();
	}
}
