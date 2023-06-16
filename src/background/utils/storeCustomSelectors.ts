import { debounce } from "lodash";
import { StoreCustomSelectors } from "../../typings/RequestFromContent";
import { sendRequestToContent } from "../messaging/sendRequestToContent";
import { notify } from "./notify";
import { withLockedStorageValue } from "./withLockedStorageValue";

let notificationTimeout: ReturnType<typeof setTimeout> | undefined;
let notifySuccess = false;
let modifiedSelectors = new Set<string>();

const updateCustomSelectorsHints = debounce(async () => {
	await sendRequestToContent({
		type: "handleCustomSelectorsChange",
		affectedSelectors: [...modifiedSelectors],
	});
}, 50);

/**
 * Since the action `confirmSelectorsCustomization` is sent to all frames, in
 * order to notify if the action was successful we need to check if there were
 * custom selectors marked in any of the frames. Depending on that we will show
 * a `success` or `warning` notification.
 */
async function handleCustomSelectorsNotification(
	customSelectorsModified: boolean,
	successMessage: string,
	failMessage: string
) {
	if (customSelectorsModified) notifySuccess = true;

	if (!notificationTimeout) {
		notificationTimeout = setTimeout(async () => {
			const message = notifySuccess ? successMessage : failMessage;
			const type = notifySuccess ? "success" : "warning";

			await updateCustomSelectorsHints();
			await notify(message, { type });
			notificationTimeout = undefined;
			notifySuccess = false;
			modifiedSelectors = new Set<string>();
		}, 200);
	}
}

export async function storeCustomSelectors({
	pattern,
	selectors,
}: StoreCustomSelectors) {
	return withLockedStorageValue("customSelectors", async (customSelectors) => {
		const customForPattern = customSelectors.get(pattern) ?? {
			include: [],
			exclude: [],
		};

		customForPattern.include = [
			...new Set([...customForPattern.include, ...selectors.include]),
		];
		customForPattern.exclude = [
			...new Set([...customForPattern.exclude, ...selectors.exclude]),
		];

		customSelectors.set(pattern, customForPattern);

		const customSelectorsAdded = [...selectors.include, ...selectors.exclude];
		if (customSelectorsAdded.length > 0) {
			for (const selector of customSelectorsAdded) {
				modifiedSelectors.add(selector);
			}
		}

		await handleCustomSelectorsNotification(
			customSelectorsAdded.length > 0,
			"Custom selectors saved",
			"No selectors to save"
		);
	});
}

export async function resetCustomSelectors(pattern: string) {
	const selectorsRemoved = await withLockedStorageValue(
		"customSelectors",
		async (customSelectors) => {
			const selectorsForPattern = customSelectors.get(pattern);

			if (!selectorsForPattern) return [];

			const { include, exclude } = selectorsForPattern;

			customSelectors.delete(pattern);
			return [...include, ...exclude];
		}
	);

	if (selectorsRemoved.length > 0) {
		for (const selector of selectorsRemoved) {
			modifiedSelectors.add(selector);
		}
	}

	await handleCustomSelectorsNotification(
		selectorsRemoved.length > 0,
		"Custom selectors reset",
		"No custom selectors for the current page"
	);

	return [...modifiedSelectors];
}
