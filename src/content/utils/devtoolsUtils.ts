import { getHintsCache } from "../hints/hintsCache";
import { getHintsStackForTab } from "../hints/hintsRequests";
import { getAllWrappers, getHintedWrappers, getWrapper } from "../wrappers";

// This is not exact but I can't find a definition of exportFunction
declare function exportFunction(
	func: Function,
	target: EventTarget,
	options: { defineAs: string }
): void;

// This only works in Firefox
export function loadDevtoolsUtils() {
	if (
		process.env["NODE_ENV"] !== "production" &&
		typeof exportFunction !== "undefined"
	) {
		exportFunction(
			(target: Element | string) => {
				const wrapper = getWrapper(target);
				console.log(wrapper);
			},
			window,
			{ defineAs: "logWrapper" }
		);

		exportFunction(
			(onlyHinted = false) => {
				const wrappers = onlyHinted ? getHintedWrappers() : getAllWrappers();
				console.log(wrappers);
			},
			window,
			{ defineAs: "logWrappers" }
		);

		exportFunction(
			async () => {
				const stack = await getHintsStackForTab();
				console.log(stack);
			},
			window,
			{ defineAs: "logHintsStack" }
		);

		exportFunction(
			async () => {
				console.log(getHintsCache());
			},
			window,
			{ defineAs: "logHintsCache" }
		);
	}
}
