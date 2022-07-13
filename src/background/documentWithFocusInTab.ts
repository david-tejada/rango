import browser from "webextension-polyfill";

// This function checks if any of the frames in the current tab has focus.
// We use this to avoid clicking when the user is in the devtools or in the adress bar.
// It's possible that there is no focused document but the user isn't in one of those places.
// For example, if you open a popup iframe and then go to a new tab, when you return
// to the origin tab, no document will be focused. e.g.: Gmail
export async function documentWithFocusInTab(tabId: number): Promise<boolean> {
	const allFrames = await browser.webNavigation.getAllFrames({
		tabId,
	});

	const requesting = allFrames.map(async (frame) =>
		browser.tabs.sendMessage(
			tabId,
			{
				type: "checkIfDocumentHasFocus",
			},
			{ frameId: frame.frameId }
		)
	) as Array<Promise<boolean>>;

	try {
		// If there is no document focused (for example, the user is in the address
		// bar or the devtools) this will throw an AggregateError that will be
		// handled by the catch below
		await Promise.any(requesting);
	} catch (error: unknown) {
		if (error instanceof AggregateError) {
			return false;
		}

		console.error(error);
	}

	return true;
}
