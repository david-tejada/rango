import browser from "webextension-polyfill";
import { throttle } from "lodash";
import { getCachedSetting } from "../settings/cacheSettings";
import { retrieve } from "../../common/storage";

let lastUrlAdded: string | undefined;
let titleBeforeDecoration: string | undefined;
let titleAfterDecoration: string | undefined;

async function getTitlePrefix() {
	const includeTabMarkers = await retrieve("includeTabMarkers");

	if (!includeTabMarkers) return "";

	const tabMarker = (await browser.runtime.sendMessage({
		type: "getTabMarker",
	})) as string;

	const tabMarkerUppercase = await retrieve("uppercaseTabMarkers");

	return tabMarkerUppercase
		? `${tabMarker.toUpperCase()} | `
		: `${tabMarker} | `;
}

async function getTitleSuffix() {
	const urlInTitle = await retrieve("urlInTitle");

	if (urlInTitle) {
		lastUrlAdded = window.location.href;
		return ` - ${window.location.href}`;
	}

	return "";
}

async function decorateTitle() {
	if (document.title !== titleAfterDecoration) {
		titleBeforeDecoration = document.title;
	}

	const prefix = await getTitlePrefix();
	const suffix = await getTitleSuffix();
	document.title = prefix + titleBeforeDecoration! + suffix;

	titleAfterDecoration = document.title;
}

const throttledMutationCallback = throttle(async () => {
	// We need to check if the url has changed every time there is a mutation.
	// The URL could be changed using something like history.pushState and
	// sometimes the title doesn't even change (issue #75).
	if (window.location.href !== lastUrlAdded) {
		await decorateTitle();
	}
}, 500);

async function removeDecorations() {
	const prefixRe = /^[a-z]{1,2} \| /i;
	document.title = document.title.replace(prefixRe, "");

	if (await retrieve("urlInTitle")) {
		const suffixRe = new RegExp(` - ${window.location.href}$`);
		document.title = document.title.replace(suffixRe, "");
	}
}

export async function initTitleDecoration() {
	const urlInTitle = getCachedSetting("urlInTitle");

	// Remove decorations when the content script starts. Prevents decorations
	// from being added multiple times when the extension is updated. This can
	// happen in development and also if the user updates the extension by
	// clicking the button to check for updates.
	if (titleBeforeDecoration === undefined) {
		await removeDecorations();
	}

	await decorateTitle();

	// Here urlInTitle === undefined is mostly for testing purposes. As when we
	// start the browser sometimes the options haven't been initialized
	if (urlInTitle) {
		window.addEventListener("hashchange", async () => {
			await decorateTitle();
		});
	}

	if (
		urlInTitle ||
		urlInTitle === undefined ||
		(await retrieve("includeTabMarkers"))
	) {
		const mutationObserver = new MutationObserver(throttledMutationCallback);

		mutationObserver.observe(document, {
			attributes: true,
			childList: true,
			subtree: true,
		});
	}
}
