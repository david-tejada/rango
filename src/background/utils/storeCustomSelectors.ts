import assertNever from "assert-never";
import { debounce } from "lodash";
import { type CustomSelector } from "../../typings/StorageSchema";
import { notify } from "./notify";
import { withLockedStorageAccess } from "./withLockedStorageValue";
import { filterInPlace } from "./arrayUtils";

let notifySuccess = false;
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

	// Reset the success flag after the debounce period.
	notifySuccess = false;

	if (batchUpdatePromiseResolve) {
		batchUpdatePromiseResolve();
		batchUpdatePromiseResolve = undefined;
		batchUpdatePromise = undefined;
	}
}, 200);

async function updateCustomSelectors(
	action: ActionType,
	url: string,
	selectors?: CustomSelector[]
) {
	const selectorsAffected = await withLockedStorageAccess(
		"customSelectors",
		async (customSelectors) => {
			if (action === "store") {
				if (!selectors) throw new Error("No selectors provided to store");
				customSelectors.push(...selectors);

				return selectors;
			}

			if (action === "reset") {
				const selectorsForPattern =
					customSelectors.filter(({ pattern }) => {
						const patternRe = new RegExp(pattern);
						return patternRe.test(url);
					}) ?? [];

				// We need to filter the array in place because assigning would just
				// modify the argument.
				filterInPlace(customSelectors, ({ pattern }) => {
					const patternRe = new RegExp(pattern);
					return !patternRe.test(url);
				});

				return selectorsForPattern ?? [];
			}

			return assertNever(action);
		}
	);

	// Update notifySuccess to true if any of the calls within the debounce period is successful.
	if (selectorsAffected.length > 0) notifySuccess = true;

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
 * Stores the custom selectors for the given URL. It handles being
 * called multiple times to handle multiple frames wanting to change the custom
 * selectors. It waits for a sequence of calls to finish before returning. Once
 * calls have stopped it notifies if storing the custom selectors was
 * successful, that is if any of the calls in the sequence resulted in custom
 * selectors being added.
 *
 * @param url The URL where selectors apply
 * @param selectors The selectors to store for the URL
 */
export async function storeCustomSelectors(
	url: string,
	selectors: CustomSelector[]
) {
	await updateCustomSelectors("store", url, selectors);
}

/**
 * Resets the custom selectors for the given URL pattern. It handles being
 * called multiple times to handle multiple frames wanting to reset the custom
 * selectors. It waits for a sequence of calls to finish before returning. Once
 * calls have stopped it notifies if resetting the custom selectors was
 * successful, that is if any of the calls in the sequence resulted in custom
 * selectors being removed.
 *
 * @param url The URL pattern where selectors apply
 */
export async function resetCustomSelectors(url: string) {
	await updateCustomSelectors("reset", url);
}
