import { throttle } from "lodash";
import { cacheHints, clearHintsCache } from "../hints/hintsCache";
import { getAllWrappers, getHintedWrappers } from "./wrappers";

type Options = {
	// Only affect ElementWrappers with an active Hint
	hintsColors?: boolean;
	hintsPosition?: boolean;
	hintsCharacters?: boolean;

	// Affect all ElementWrappers
	isHintable?: boolean;
	shouldBeHinted?: boolean;

	// Refresh only ElementWrappers matching one of these selectors
	filterIn?: string[];
};

/**
 * Combined options since the last `throttledRefresh` callback run.
 */
let combinedOptions: Options = {
	filterIn: [],
};

/**
 * Combine two sets of Options. For simplicity we don't relate the feature to
 * update with its `filterIn` selectors. For example, given the next two set of
 * Options:
 *
 * options1: `{hintsColors: true, filterIn: [".button"]}`
 *
 * options2: `{isHintable: true, filterIn: [".checkbox"]}`
 *
 * Ideally, we should combine them in a way so that wrappers that match
 * `.button` update their `hintsColors` and those that match `.checkbox` update
 * their `isHintable`. We instead join the options resulting in the equivalent of:
 *
 * combined: `{hintsColors: true, isHintable: true, filterIn: [".button", ".checkbox"]}`
 *
 * @param existingOptions Combined Options so far.
 * @param newOptions Options to combine into existingOptions.
 * @returns The combined Options object.
 */
function combineOptions(existingOptions: Options, newOptions: Options) {
	const combined: Options = { ...existingOptions };

	let key: keyof Options;
	for (key in newOptions) {
		if (Object.prototype.hasOwnProperty.call(newOptions, key)) {
			if (key === "filterIn") {
				if (!existingOptions.filterIn) continue;

				combined.filterIn = [
					...existingOptions.filterIn,
					...(newOptions.filterIn ?? []),
				];
			} else {
				combined[key] ||= Boolean(newOptions[key]);
			}
		}
	}

	// We remove the filterSelectors if any of the calls doesn't have one.
	if (!newOptions.filterIn) {
		combined.filterIn = undefined;
	}

	return combined;
}

/**
 * Get the element wrappers that need to be updated based on the Options passed.
 *
 * @param options The Options object to compute the affected ElementWrappers.
 * @returns An array of ElementWrappers that need to be updated.
 */
function getElementWrappersToUpdate(options: Options) {
	const { hintsCharacters, isHintable, shouldBeHinted } = options;

	const wrappersToUpdate =
		isHintable || shouldBeHinted ? getAllWrappers() : getHintedWrappers();

	// Filter element wrappers
	const { filterIn: includeSelectors } = combinedOptions;

	if (!includeSelectors?.length) {
		return wrappersToUpdate;
	}

	return wrappersToUpdate.filter(
		(wrapper) =>
			wrapper.element.matches(includeSelectors.join(", ")) ||
			// With `hintsCharacters: true` we must refresh all wrappers that have a
			// hint since all the hints must be refreshed.
			(hintsCharacters && wrapper.hint?.string)
	);
}

const throttledRefresh = throttle(
	async () => {
		const {
			hintsColors,
			hintsPosition,
			hintsCharacters,
			isHintable,
			shouldBeHinted,
		} = combinedOptions;

		const wrappersToUpdate = getElementWrappersToUpdate(combinedOptions);

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
				wrapper.updateShouldBeHinted();
			}

			if (hintsColors) wrapper.hint?.updateColors();

			// Any call to modify a Hint's properties will also position it.
			if (hintsPosition && !hintsColors && !hintsCharacters) {
				wrapper.hint?.position();
			}

			if (hintsCharacters && wrapper.shouldBeHinted) {
				wrapper.hint?.release(false, false);
				wrapper.hint?.claim();
			}
		}

		combinedOptions = {
			filterIn: [],
		};
	},
	100,
	{ leading: false }
);

/**
 * Refresh hints and/or hintable status of element wrappers.
 *
 * @param options What Hint features or ElementWrapper properties to refresh:
 * @param {boolean} [options.hintsColors] Refresh colors for active Hints.
 * @param {boolean} [options.hintsPosition] Refresh position for active Hints.
 * @param {boolean} [options.hintsCharacters] Refresh characters for active Hints.
 * @param {boolean} [options.isHintable] Recompute isHintable for ElementWrappers.
 * @param {boolean} [options.shouldBeHinted] Recompute shouldBeHinted for ElementWrappers.
 * @param {string[]} [options.filterIn] Filter in only ElementWrappers matching this selectors.
 */
export async function refresh(options?: Options) {
	// `refresh()` should update isHintable for all ElementWrappers when no
	// options are passed.
	options ??= { isHintable: true };

	// Apart from `filterIn` we need at least one option for what to update. So if
	// something like `refresh({filterIn: [".ofLink"]})` is passed we assume the
	// property to update is isHintable.
	if (Object.keys(options).filter((key) => key !== "filterIn").length === 0) {
		options.isHintable = true;
	}

	combinedOptions = combineOptions(combinedOptions, options);

	await throttledRefresh();
}
