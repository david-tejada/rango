import assertNever from "assert-never";
import { debounce } from "lodash";
import { CustomSelectorsForPattern } from "../../typings/StorageSchema";
import { notify } from "./notify";
import { withLockedStorageAccess } from "./withLockedStorageValue";

let notifySuccess = false;
const modifiedSelectors = new Set<string>();
let batchUpdatePromise: Promise<void> | undefined;
let batchUpdatePromiseResolve: (() => void) | undefined;

type ActionType = "store" | "reset";
type ActionNotificationMessages = { success: string; fail: string };

const messages: Record<ActionType, ActionNotificationMessages> = {
	store: {
		success: "Custom selectors saved",
		fail: "No selectors to save",
	},
	reset: {
		success: "Custom selectors reset",
		fail: "No custom selectors for the current page",
	},
};

/**
 * Notifies with a toast message and resets to the initial state once enough
 * time has passed since the last call to the function. It also calls
 * `batchUpdatePromiseResolve` so all the ongoing calls to
 * `updateCustomSelectors` can finish.
 */
const debouncedNotifyAndReset = debounce(async (action: ActionType) => {
	const message = notifySuccess
		? messages[action].success
		: messages[action].fail;
	const type = notifySuccess ? "success" : "warning";

	await notify(message, { type });

	// Reset the success flag and clear the set after the debounce period.
	notifySuccess = false;
	modifiedSelectors.clear();

	if (batchUpdatePromiseResolve) {
		batchUpdatePromiseResolve();
		batchUpdatePromiseResolve = undefined;
		batchUpdatePromise = undefined;
	}
}, 200);

async function updateCustomSelectors(
	action: ActionType,
	pattern: string,
	selectors?: CustomSelectorsForPattern
) {
	const selectorsAffected = await withLockedStorageAccess(
		"customSelectors",
		async (customSelectors) => {
			const selectorsForPattern = customSelectors.get(pattern) ?? {
				include: [],
				exclude: [],
			};

			if (action === "store") {
				if (!selectors) throw new Error("No selectors provided to store");

				selectorsForPattern.include = Array.from(
					new Set([...selectorsForPattern.include, ...selectors.include])
				);
				selectorsForPattern.exclude = Array.from(
					new Set([...selectorsForPattern.exclude, ...selectors.exclude])
				);
				customSelectors.set(pattern, selectorsForPattern);
				return [...selectors.include, ...selectors.exclude];
			}

			if (action === "reset") {
				customSelectors.delete(pattern);
				return selectorsForPattern
					? [...selectorsForPattern.include, ...selectorsForPattern.exclude]
					: [];
			}

			return assertNever(action);
		}
	);

	// Update notifySuccess to true if any of the calls within the debounce period is successful.
	if (selectorsAffected.length > 0) notifySuccess = true;

	for (const selector of selectorsAffected) {
		modifiedSelectors.add(selector);
	}

	await debouncedNotifyAndReset(action);

	if (batchUpdatePromise) {
		await batchUpdatePromise;
	} else {
		batchUpdatePromise = new Promise((resolve) => {
			batchUpdatePromiseResolve = resolve;
		});
		await batchUpdatePromise;
	}
}

/**
 * Stores the custom selectors for the given URL pattern. It handles being
 * called multiple times to handle multiple frames wanting to change the custom
 * selectors. It waits for a sequence of calls to finish before returning. Once
 * calls have stopped it notifies if storing the custom selectors was
 * successful, that is if any of the calls in the sequence resulted in custom
 * selectors being added.
 *
 * @param pattern The URL pattern where selectors apply
 * @param selectors An object with `include` and `exclude` CSS selectors for the given pattern
 */
export async function storeCustomSelectors(
	pattern: string,
	selectors: CustomSelectorsForPattern
) {
	await updateCustomSelectors("store", pattern, selectors);
}

/**
 * Resets the custom selectors for the given URL pattern. It handles being
 * called multiple times to handle multiple frames wanting to reset the custom
 * selectors. It waits for a sequence of calls to finish before returning. Once
 * calls have stopped it notifies if resetting the custom selectors was
 * successful, that is if any of the calls in the sequence resulted in custom
 * selectors being removed.
 *
 * @param pattern The URL pattern where selectors apply
 */
export async function resetCustomSelectors(pattern: string) {
	await updateCustomSelectors("reset", pattern);
}
