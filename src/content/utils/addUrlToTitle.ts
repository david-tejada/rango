import { getCachedSetting } from "../settings/cacheSettings";

let lastUrlAdded: string | undefined;

export async function addUrlToTitle() {
	const urlInTitle = getCachedSetting("urlInTitle");

	// Here urlInTitle === undefined is mostly for testing purposes. As when we
	// start the browser sometimes the options haven't been initialized
	if (urlInTitle || urlInTitle === undefined) {
		window.addEventListener("hashchange", () => {
			document.title =
				lastUrlAdded && document.title?.includes(lastUrlAdded)
					? document.title.replace(lastUrlAdded, window.location.href)
					: document.title + " - " + window.location.href;

			lastUrlAdded = window.location.href;
		});

		if (document.title && !document.title.includes(window.location.href)) {
			document.title = document.title + " - " + window.location.href;
			lastUrlAdded = window.location.href;
		}

		const mutationObserver = new MutationObserver(() => {
			// We need to check if the url has changed every time there is a mutation.
			// The URL could be changed using something like history.pushState and
			// sometimes the title doesn't even change (issue #75).
			if (document.title && !document.title.includes(window.location.href)) {
				document.title =
					lastUrlAdded && document.title.includes(lastUrlAdded)
						? document.title.replace(lastUrlAdded, window.location.href)
						: document.title + " - " + window.location.href;

				lastUrlAdded = window.location.href;
			}
		});

		const config = { attributes: true, childList: true, subtree: true };
		mutationObserver.observe(document, config);
	}
}
