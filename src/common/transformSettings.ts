import { z } from "zod";
import { isValidSelector } from "../content/utils/selectorUtils";
import { isValidRegExp } from "../content/utils/textUtils";
import { CustomSelector, StorageSchema } from "../typings/StorageSchema";

type CustomsSelectorsLegacyEntry = [
	string,
	{
		include: string[];
		exclude: string[];
	}
];

/**
 * Handle customSelectors type conversion from a previous type (Object or Map)
 * to an array. This is only necessary temporarily in order not to lose user's
 * customizations. Before v0.5.0 we used plain objects and before v0.7.0 we used
 * maps. If for some reason it can't upgrade the setting it returns the passed
 * value.
 */
export function upgradeCustomSelectors(value: unknown) {
	let legacyEntries:
		| IterableIterator<CustomsSelectorsLegacyEntry>
		| CustomsSelectorsLegacyEntry[]
		| undefined;

	// Before v0.5.0 we used plain objects.
	const customSelectorsObject = z
		.record(
			z.string(),
			z.object({
				include: z.array(z.string()),
				exclude: z.array(z.string()),
			})
		)
		.safeParse(value);

	// Before v0.7.0 we used maps.
	const customSelectorsMap = z
		.map(
			z.string(),
			z.object({
				include: z.array(z.string()),
				exclude: z.array(z.string()),
			})
		)
		.safeParse(value);

	if (customSelectorsMap.success) {
		legacyEntries = customSelectorsMap.data.entries();
	}

	if (customSelectorsObject.success) {
		legacyEntries = Object.entries(customSelectorsObject.data);
	}

	if (!legacyEntries) return value;

	const result = new Array<CustomSelector>();

	for (const [pattern, { include, exclude }] of legacyEntries) {
		for (const selector of include) {
			result.push({
				pattern,
				type: "include",
				selector,
			});
		}

		for (const selector of exclude) {
			result.push({
				pattern,
				type: "exclude",
				selector,
			});
		}
	}

	return result;
}

/**
 * Perform some transformations to certain settings, like removing invalid
 * entries or sorting. Otherwise return the same value untouched.
 */
export function prepareSettingForStoring<T extends keyof StorageSchema>(
	key: T,
	value: StorageSchema[T]
) {
	switch (key) {
		case "customSelectors":
			return (
				(value as StorageSchema["customSelectors"])
					.filter(
						({ pattern, selector }) =>
							isValidRegExp(pattern) && isValidSelector(selector)
					)
					// Sorting is only necessary for displaying the setting in the
					// settings page. We perform the sorting here and that way we only
					// need to do it when the setting changes.
					.sort(
						(a, b) =>
							a.pattern.localeCompare(b.pattern) ||
							(a.type === "include" ? -1 : 1)
					) as StorageSchema[T]
			);
		case "keysToExclude":
			return (value as StorageSchema["keysToExclude"]).filter(
				([pattern]) => pattern
			) as StorageSchema[T];
		default:
			return value;
	}
}
