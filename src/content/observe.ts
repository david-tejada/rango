import { addWrapper, mutationObserver } from "./wrappers";

const config = { attributes: true, childList: true, subtree: true };

export default function observe() {
	// We observe all the initial elements before any mutation
	addWrapper(document.body);

	// We observe document instead of document.body in case the body gets replaced
	mutationObserver.observe(document, config);
}
