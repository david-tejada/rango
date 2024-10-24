import { getHintsCache } from "../hints/hintsCache";
import { getHintStackForTab } from "../hints/hintsRequests";
import {
	getAllWrappers,
	getHintedWrappers,
	getWrapper,
} from "../wrappers/wrappers";

// This is not exact but I can't find a definition of exportFunction
declare function exportFunction(
	function_: Function,
	target: EventTarget,
	options: { defineAs: string }
): void;

// This only works in Firefox
export function loadDevtoolsUtils() {
	if (
		process.env["NODE_ENV"] !== "production" &&
		// eslint-disable-next-line unicorn/no-typeof-undefined
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
				const stack = await getHintStackForTab();
				console.log(stack);
			},
			window,
			{ defineAs: "logHintStack" }
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
