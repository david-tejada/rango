import browser from "webextension-polyfill";

export async function addUrlToTitle() {
	const { urlInTitle } = (await browser.storage.local.get(
		"urlInTitle"
	)) as Record<string, boolean>;
	if (urlInTitle) {
		if (!document.title.includes(window.location.href)) {
			document.title = document.title + " - " + window.location.href;
		}

		const headObserver = new MutationObserver(() => {
			// We don't care to check if <title> was changed, in involves looping over addedNodes, ...
			// I think it's quicker this way
			if (!document.title.includes(window.location.href)) {
				document.title = document.title + " - " + window.location.href;
			}
		});
		const config = { attributes: true, childList: true, subtree: true };
		headObserver.observe(document.head, config);
	}
}
