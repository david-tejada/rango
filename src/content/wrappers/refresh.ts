import { throttle } from "lodash";
import { RequireAtLeastOne } from "../../typings/TypingUtils";
import { cacheHints, clearHintsCache } from "../hints/hintsCache";
import { getAllWrappers, getHintedWrappers } from "./wrappers";

type WhatToRefresh = RequireAtLeastOne<{
	// Only affect hinted wrappers
	hintsColors?: boolean;
	hintsPosition?: boolean;
	hintsCharacters?: boolean;

	// Affect all wrappers
	isHintable?: boolean;
	shouldBeHinted?: boolean;
}>;

type Options = {
	filterSelectors?: string[];
};

/**
 * Combined whatToRefresh flags since the last `throttledRefresh` callback run.
 */
let combinedWhatToRefresh: WhatToRefresh = {
	// WhatToRefresh requires at least one property to be defined
	hintsColors: false,
};

/**
 * Combined options since the last `throttledRefresh` callback run.
 */
let combinedOptions: Options = {
	filterSelectors: [],
};

/**
 * Get the element wrappers that need to be updated. It takes into account all
 * the combined calls to `refreshHints` since the last `throttledRefresh` func
 * call.
 *
 * @returns An array of ElementWrapper(s) that need to be updated.
 */
function getElementWrappersToUpdate() {
	const { hintsCharacters, isHintable, shouldBeHinted } = combinedWhatToRefresh;

	const wrappersToUpdate =
		isHintable || shouldBeHinted ? getAllWrappers() : getHintedWrappers();

	// Filter element wrappers
	const { filterSelectors } = combinedOptions;

	const selectorsToFilter = [...(filterSelectors ?? [])];

	const filterSelector = selectorsToFilter.join(", ");

	if (!filterSelector) {
		return wrappersToUpdate;
	}

	return wrappersToUpdate.filter(
		(wrapper) =>
			wrapper.element.matches(filterSelector) ||
			// With `hintsCharacters: true` we must refresh all wrappers that have a
			// hint since all the hints must be refreshed.
			(hintsCharacters && wrapper.hint?.string)
	);
}

const throttledRefresh = throttle(
	async () => {
		console.log("throttledRefresh()", combinedWhatToRefresh, combinedOptions);
		const {
			hintsColors,
			hintsPosition,
			hintsCharacters,
			isHintable,
			shouldBeHinted,
		} = combinedWhatToRefresh;

		const wrappersToUpdate = getElementWrappersToUpdate();

		// console.log(wrappersToUpdate);

		if (hintsCharacters) {
			await clearHintsCache();

			const hintsNecessary = wrappersToUpdate.filter(
				(wrapper) => wrapper.isIntersectingViewport
			).length;
			const hintsAdditional = wrappersToUpdate.filter(
				(wrapper) => wrapper.isIntersecting && !wrapper.isIntersectingViewport
			).length;
			await cacheHints(hintsNecessary, hintsAdditional);
		}

		for (const wrapper of wrappersToUpdate) {
			if (isHintable) {
				wrapper.updateIsHintable();
			} else if (shouldBeHinted) {
				// At the end of ElementWrapper.isHintable()
				// ElementWrapper.shouldBeHinted() is called so this branch only must be
				// executed if !isHintable
				wrapper.updateShouldBeHinted();
			}

			if (hintsColors) wrapper.hint?.updateColors();
			if (hintsPosition) wrapper.hint?.position();
			if (hintsCharacters && wrapper.shouldBeHinted) {
				wrapper.hint?.release(false, false);
				wrapper.hint?.claim();
			}
		}

		combinedWhatToRefresh = {
			// WhatToRefresh requires at least one property to be defined
			hintsColors: false,
		};
		combinedOptions = {
			filterSelectors: [],
		};
	},
	100,
	{ leading: false }
);

/**
 * Refresh hints and/or hintable status of element wrappers.
 *
 * @param whatToRefresh What hint features or element wrapper properties to refresh:
 * @param {boolean} [whatToRefresh.hintsColors] Refresh hint colors of existing hints.
 * @param {boolean} [whatToRefresh.hintsPosition] Refresh hint position of existing hints.
 * @param {boolean} [whatToRefresh.hintsCharacters] Refresh hint characters of existing hints.
 * @param {boolean} [whatToRefresh.isHintable] Recompute isHintable for all element wrappers.
 * @param {boolean} [whatToRefresh.shouldBeHinted] Recompute shouldBeHinted for all element wrappers.
 *
 * @param options Selector options and other options.
 * @param {string[]} [options.filterSelector] Recompute only element wrappers matching this selector.
 */
export async function refresh(whatToRefresh: WhatToRefresh, options?: Options) {
	console.log("refresh()", whatToRefresh, options);
	let key: keyof WhatToRefresh;
	for (key in whatToRefresh) {
		if (Object.prototype.hasOwnProperty.call(whatToRefresh, key)) {
			combinedWhatToRefresh[key] ||= Boolean(whatToRefresh[key]);
		}
	}

	// In theory, the options could be different for different whatToRefresh
	// properties (of differing calls to hintsRefresh) but we just combine them
	// all for simplicity. If any of the calls to hintsRefresh doesn't have any
	// filter we just removed all the options from the combinedFilters.

	// We combine the filters
	if (options?.filterSelectors) {
		combinedOptions.filterSelectors = [
			...(combinedOptions.filterSelectors ?? []),
			...options.filterSelectors,
		];
	}

	// // We calculate the rest of the options
	// let optionKey: keyof Options;
	// for (optionKey in options) {
	// 	if (
	// 		Object.prototype.hasOwnProperty.call(options, optionKey) &&
	// 		optionKey !== "filterSelectors"
	// 	) {
	// 		combinedOptions[optionKey] ||= Boolean(options![optionKey]);
	// 	}
	// }

	combinedOptions = options ? Object.assign(combinedOptions, options) : {};

	await throttledRefresh();
}

// =============================================================================
// EXAMPLES
// =============================================================================

// updateStyleAll()
// refresh({ hintsColors: true });

// // updatePositionAll()
// refresh({ hintsPosition: true });

// // updateShouldBeHintedAll()
// refresh({ shouldBeHinted: true });

// // updateIsHintableAll()
// refresh({ isHintable: true });

// // updateHintablesBySelector(selector)
// refresh(
// 	{
// 		hintsColors: true,
// 		isHintable: true,
// 	},
// 	{ filterSelector: ".some-selector" }
// );

// // updateRecentCustomSelectors()
// refresh({ isHintable: true }, { clearMarked: true });

// // refreshHints() for resetCustomSelectors
// refresh(
// 	{
// 		isHintable: true,
// 	},
// 	{ filterSelector: "custom-selectors-removed", clearMarked: true }
// );

// // refreshHints() for watchSettingsChanges
// refresh({ hintsCharacters: true });

// // Call in mutation observer when styles might have changed
// refresh({ hintsPosition: true, hintsColors: true, shouldBeHinted: true });

// // Call in mutation observer when styles didn't change
// refresh({ hintsPosition: true });
