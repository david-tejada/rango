import { type ElementWrapper } from "../../typings/ElementWrapper";

export async function getAnchorHrefs(wrappers: ElementWrapper[]) {
	for (const wrapper of wrappers) wrapper.hint?.flash();

	return wrappers
		.map((wrapper) => wrapper.element)
		.filter((element) => element instanceof HTMLAnchorElement)
		.map((element) => element.href);
}
