import { StoreCustomSelectors } from "../../typings/RequestFromContent";
import { notify } from "./notify";
import { withLockedStorageValue } from "./withLockedStorageValue";

let notificationTimeout: ReturnType<typeof setTimeout> | undefined;
let notifySuccess = false;

/**
 * Since the action `confirmSelectorsCustomization` is sent to all frames, in
 * order to notify if the action was successful we need to check if there were
 * custom selectors marked in any of the frames. Depending on that we will show
 * a `success` or `warning` notification.
 */
async function handleCustomSelectorsNotification(
	customSelectorsAdded: boolean
) {
	if (customSelectorsAdded) notifySuccess = true;

	if (!notificationTimeout) {
		notificationTimeout = setTimeout(async () => {
			const message = notifySuccess
				? "Custom selectors saved"
				: "No selectors to save";
			const type = notifySuccess ? "success" : "warning";

			await notify(message, { type });
			notificationTimeout = undefined;
			notifySuccess = false;
		}, 200);
	}
}

export async function storeCustomSelectors({
	pattern,
	selectors,
}: StoreCustomSelectors) {
	return withLockedStorageValue("customSelectors", async (customSelectors) => {
		const customForPattern = customSelectors[pattern] ?? {
			include: [],
			exclude: [],
		};

		customForPattern.include = [
			...new Set([...customForPattern.include, ...selectors.include]),
		];
		customForPattern.exclude = [
			...new Set([...customForPattern.exclude, ...selectors.exclude]),
		];

		customSelectors[pattern] = customForPattern;

		const customSelectorsAdded =
			selectors.include.length > 0 || selectors.exclude.length > 0;
		await handleCustomSelectorsNotification(customSelectorsAdded);
	});
}
