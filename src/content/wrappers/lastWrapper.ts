import { ElementWrapper } from "../../typings/ElementWrapper";

let lastWrapper: ElementWrapper | undefined;

export function getLastWrapper() {
	return lastWrapper;
}

export function setLastWrapper(wrapper: ElementWrapper) {
	lastWrapper = wrapper;
}
