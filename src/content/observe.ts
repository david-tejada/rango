import { addWrappersFromOrigin, mutationObserver } from "./Wrapper";

const config = { attributes: true, childList: true, subtree: true };

export default function observe() {
	// We observe all the initial elements before any mutation
	addWrappersFromOrigin(document.body);

	// We observe document instead of document.body in case the body gets replaced
	mutationObserver.observe(document, config);
}
