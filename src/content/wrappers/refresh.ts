import { debounce } from "lodash";
import { onDocumentVisible } from "../dom/whenVisible";
import { onSettingChange } from "../settings/settingsManager";
import { getAllWrappers, getHintedWrappers } from "./wrappers";

type Options = {
	// Only affect ElementWrappers with an active Hint
	hintsStyle?: boolean;
	hintsColors?: boolean;
	hintsPosition?: boolean;

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
		if (Object.hasOwn(newOptions, key)) {
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
	const { isHintable = false, shouldBeHinted = false } = options;

	const wrappersToUpdate =
		isHintable || shouldBeHinted ? getAllWrappers() : getHintedWrappers();

	// Filter element wrappers
	const { filterIn: includeSelectors } = combinedOptions;

	if (!includeSelectors?.length) {
		return wrappersToUpdate;
	}

	return wrappersToUpdate.filter((wrapper) =>
		wrapper.element.matches(includeSelectors.join(", "))
	);
}

const debouncedRefresh = debounce(async () => {
	const { hintsStyle, hintsColors, hintsPosition, isHintable, shouldBeHinted } =
		combinedOptions;

	const wrappersToUpdate = getElementWrappersToUpdate(combinedOptions);

	for (const wrapper of wrappersToUpdate) {
		if (isHintable) {
			wrapper.updateIsHintable();
		} else if (shouldBeHinted) {
			wrapper.updateShouldBeHinted();
		}

		if (hintsStyle) wrapper.hint?.applyDefaultStyle();
		if (hintsColors) wrapper.hint?.updateColors();

		if (!wrapper.hint?.isActive) continue;

		// Whenever we call Hint.claim() the hint gets positioned, so here we
		// prevent Hint.position() to be called twice.
		if (hintsPosition) {
			wrapper.hint?.position();
		}
	}

	combinedOptions = {
		filterIn: [],
	};
}, 100);

/**
 * Refresh hints and/or hintable status of element wrappers. If no options are
 * passed it will recalculate isHintable for all ElementWrappers.
 *
 * @param options What Hint features or ElementWrapper properties to refresh:
 * @param {boolean} [options.hintsColors] Refresh colors for active Hints.
 * @param {boolean} [options.hintsPosition] Refresh position for active Hints.
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

	await debouncedRefresh();
}

async function handleHintStyleChange() {
	await refresh({ hintsStyle: true, hintsPosition: true });
}

onSettingChange(
	[
		"hintUppercaseLetters",
		"hintFontFamily",
		"hintFontSize",
		"hintWeight",
		"hintBackgroundColor",
		"hintBackgroundOpacity",
		"hintFontColor",
		"hintBorderWidth",
		"hintBorderRadius",
		"hintMinimumContrastRatio",
		"hintBorderWidth",
	],
	async () => {
		onDocumentVisible(handleHintStyleChange);
	}
);
