import { type ElementWrapper } from "./ElementWrapper";

let lastWrapper: ElementWrapper | undefined;

/**
 * Get the last wrapper targeted by a Rango action. Used for references.
 */
export function getLastTargetedWrapper() {
	return lastWrapper;
}

/**
 * Set the last wrapper targeted by a Rango action. Used for references.
 */
export function setLastTargetedWrapper(wrapper: ElementWrapper) {
	lastWrapper = wrapper;
}
