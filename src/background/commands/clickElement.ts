import browser, { type WebNavigation } from "webextension-polyfill";
import { settings } from "../../common/settings/settings";
import { isTargetError } from "../../common/target/TargetError";
import { type TalonAction } from "../../typings/TalonAction";
import { type ElementMark, type Target } from "../../typings/Target/Target";
import { sendMessage } from "../messaging/sendMessage";
import { sendMessageToAllFrames } from "../messaging/sendMessageToAllFrames";
import { sendMessageToTargetFrames } from "../messaging/sendMessageToTargetFrames";
import {
	isUnreachableFrameError,
	UnreachableContentScriptError,
} from "../messaging/UnreachableContentScriptError";
import { getRequiredCurrentTabId } from "../tabs/getCurrentTab";
import { promiseWrap } from "../utils/promises";

export async function clickElement(target: Target<ElementMark>) {
	const isSingleTarget = target.type === "primitive";
	const results = await sendClickToTargetFrames(target, isSingleTarget);

	await sendMessageToAllFrames("updateNavigationToggle", {});

	// This is just to be extra safe since if there are multiple targets the
	// result of each frame must be undefined.
	return isSingleTarget ? results[0] : undefined;
}

export async function directClickElement(
	target: Target<ElementMark>
): Promise<TalonAction | TalonAction[] | undefined> {
	const isSingleTarget = target.type === "primitive";

	// Handle the possibility that the user might have intended to type those
	// characters.
	if (isSingleTarget) {
		const directClickWithNoFocusedDocument = await settings.get(
			"directClickWithNoFocusedDocument"
		);

		if (!directClickWithNoFocusedDocument) {
			const [focusedDocument] = await promiseWrap(
				sendMessage("checkIfDocumentHasFocus")
			);

			if (!focusedDocument) {
				return { name: "typeTargetCharacters" };
			}
		}

		const directClickWhenEditing = await settings.get("directClickWhenEditing");

		if (!directClickWhenEditing) {
			const { results } = await sendMessageToAllFrames(
				"hasActiveEditableElement"
			);

			if (results.includes(true)) return { name: "typeTargetCharacters" };
		}
	}

	try {
		const results = await sendClickToTargetFrames(target, isSingleTarget);

		await sendMessageToAllFrames("updateNavigationToggle", {});

		// This is just to be extra safe since if there are multiple targets the
		// result of each frame must be undefined.
		return isSingleTarget ? results[0] : undefined;
	} catch (error: unknown) {
		if (
			target.type === "primitive" &&
			(error instanceof UnreachableContentScriptError || isTargetError(error))
		) {
			return { name: "typeTargetCharacters" };
		}

		throw error;
	}
}

/**
 * Sends `clickElement` to the frames that own the target and returns their
 * results.
 */
async function sendClickToTargetFrames(
	target: Target<ElementMark>,
	isSingleTarget: boolean
) {
	const tabId = await getRequiredCurrentTabId();
	const navigation = waitForMainFrameNavigation(tabId);

	// A click that navigates can leave the page before its content script
	// replies. The click already happened and there is nothing left to do on a
	// page we have left, so it isn't a failure. Chrome and Firefox reject the
	// message, but Safari never settles it, so we also stop waiting once the tab
	// commits a new page.
	try {
		return await Promise.race([
			sendMessageToTargetFrames(
				"clickElement",
				{ target, isSingleTarget },
				tabId
			).then(({ results }) => results),
			navigation.committed.then(() => []),
		]);
	} catch (error: unknown) {
		if (isPageLeftError(error)) return [];

		throw error;
	} finally {
		navigation.stopWaiting();
	}
}

/**
 * Returns a promise that resolves when the main frame of the tab commits a new
 * page, and a function to stop listening for it.
 */
function waitForMainFrameNavigation(tabId: number) {
	let listener: (details: WebNavigation.OnCommittedDetailsType) => void;

	const committed = new Promise<void>((resolve) => {
		listener = (details) => {
			if (details.tabId === tabId && details.frameId === 0) resolve();
		};

		browser.webNavigation.onCommitted.addListener(listener);
	});

	return {
		committed,
		stopWaiting() {
			browser.webNavigation.onCommitted.removeListener(listener);
		},
	};
}

/**
 * Returns true if the error is what the browser reports when the page left
 * before its content script could reply.
 */
function isPageLeftError(error: unknown) {
	// Chrome closes the message channel when the page moves into the
	// back/forward cache. Firefox drops the listener, which reads as if the frame
	// had never been there. That is also what we get when the frame was removed
	// before the click arrived, but that is rare enough that doing nothing beats
	// an error for every click that navigates.
	return (
		(error instanceof Error &&
			error.message.includes("moved into back/forward cache")) ||
		isUnreachableFrameError(error)
	);
}
