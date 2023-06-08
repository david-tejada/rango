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
		return ` - ${window.location.href}`;
	}

	return "";
}

async function removeDecorations(prefix: string) {
	if (document.title.startsWith(prefix)) {
		document.title = document.title.slice(prefix.length);
	}

	if (await retrieve("urlInTitle")) {
		const possibleSuffix = ` - ${lastUrlAdded ?? window.location.href}`;
		if (document.title.endsWith(possibleSuffix)) {
			document.title = document.title.slice(0, -possibleSuffix.length);
		}
	}
}

async function decorateTitle() {
	const prefix = await getTitlePrefix();
	const suffix = await getTitleSuffix();

	// Make extra sure we don't duplicate the prefix or suffix. Prevents
	// decorations from being added multiple times when the extension is updated
	// and in some other difficult to reproduce situations.
	await removeDecorations(prefix);

	if (document.title !== titleAfterDecoration) {
		titleBeforeDecoration = document.title;
	}

	document.title = prefix + titleBeforeDecoration! + suffix;

	if (suffix) {
		lastUrlAdded = window.location.href;
	}

	titleAfterDecoration = document.title;
}

const throttledMutationCallback = throttle(async () => {
	// We need to check if the url has changed every time there is a mutation.
	// The URL could be changed using something like history.pushState and
	// sometimes the title doesn't even change (issue #75).
	if (
		window.location.href !== lastUrlAdded ||
		document.title !== titleAfterDecoration
	) {
		await decorateTitle();
	}
}, 500);

export async function initTitleDecoration() {
	const urlInTitle = getCachedSetting("urlInTitle");

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
