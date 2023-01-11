import browser from "webextension-polyfill";

let lastUrl: string;

export async function addUrlToTitle() {
	const { urlInTitle } = (await browser.storage.local.get(
		"urlInTitle"
	)) as Record<string, boolean>;
	if (urlInTitle) {
		window.addEventListener("hashchange", () => {
			if (document.title?.includes(lastUrl)) {
				document.title = document.title.replace(lastUrl, window.location.href);
				lastUrl = window.location.href;
			}
		});

		if (document.title && !document.title.includes(window.location.href)) {
			document.title = document.title + " - " + window.location.href;
			lastUrl = window.location.href;
		}

		const headObserver = new MutationObserver(() => {
			// We don't care to check if <title> was changed, in involves looping over addedNodes, ...
			// I think it's quicker this way
			if (document.title && !document.title.includes(window.location.href)) {
				document.title = document.title + " - " + window.location.href;
				lastUrl = window.location.href;
			}
		});
		const config = { attributes: true, childList: true, subtree: true };
		if (document.head) headObserver.observe(document.head, config);
	}
}
