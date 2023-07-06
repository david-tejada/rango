import browser from "webextension-polyfill";
import { throttle } from "lodash";
import { getCachedSetting } from "../settings/cacheSettings";
import { isMainframe } from "../setup/contentScriptContext";

// Settings
let urlInTitle: boolean;
let includeTabMarkers: boolean;
let uppercaseTabMarkers: boolean;

let lastUrlAdded: string | undefined;
let titleBeforeDecoration: string | undefined;
let titleAfterDecoration: string | undefined;

async function getTitlePrefix() {
	if (!includeTabMarkers) return "";

	const tabMarker = (await browser.runtime.sendMessage({
		type: "getTabMarker",
	})) as string;

	const marker = uppercaseTabMarkers ? tabMarker.toUpperCase() : tabMarker;

	return `${marker} | `;
}

function getTitleSuffix() {
	if (urlInTitle) {
		return ` - ${window.location.href}`;
	}

	return "";
}

export function getTitleBeforeDecoration() {
	return titleBeforeDecoration;
}

function removeDecorations(prefix?: string) {
	if (
		prefix &&
		(document.title.startsWith(prefix.toUpperCase()) ||
			document.title.startsWith(prefix.toLowerCase()))
	) {
		document.title = document.title.slice(prefix.length);
	}

	if (!prefix) {
		document.title = document.title.replace(/^[a-z]{1,2} \| /i, "");
	}

	const possibleSuffix = ` - ${lastUrlAdded ?? window.location.href}`;
	if (document.title.endsWith(possibleSuffix)) {
		document.title = document.title.slice(0, -possibleSuffix.length);
	}
}

async function decorateTitle() {
	// Sometimes the document.title is modified by the page itself starting with
	// the previous document.title. For example, in basecamp when the play button
	// is clicked, "▶︎ " is added to the front of the title. After the track is
	// stopped the first three characters of the title are removed.
	if (
		titleAfterDecoration &&
		document.title !== titleAfterDecoration &&
		document.title.includes(titleAfterDecoration)
	) {
		titleAfterDecoration = document.title;
		return;
	}

	const prefix = await getTitlePrefix();
	const suffix = getTitleSuffix();

	// Make extra sure we don't duplicate the prefix or suffix. Prevents
	// decorations from being added multiple times when the extension is updated
	// and in some other difficult to reproduce situations.
	removeDecorations(prefix);

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
		(urlInTitle && window.location.href !== lastUrlAdded) ||
		document.title !== titleAfterDecoration
	) {
		await decorateTitle();
	}
}, 500);

let mutationObserver: MutationObserver | undefined;

export async function initTitleDecoration() {
	if (!isMainframe()) return;

	const previousUrlInTitle = urlInTitle;
	const previousIncludeTabMarkers = includeTabMarkers;

	urlInTitle = getCachedSetting("urlInTitle");
	includeTabMarkers = getCachedSetting("includeTabMarkers");
	uppercaseTabMarkers = getCachedSetting("uppercaseTabMarkers");

	if (
		(previousUrlInTitle && !urlInTitle) ||
		(previousIncludeTabMarkers && !includeTabMarkers)
	) {
		removeDecorations();
	}

	if (urlInTitle || includeTabMarkers) {
		await decorateTitle();
	} else {
		mutationObserver?.disconnect();
	}

	if (urlInTitle) {
		window.addEventListener("hashchange", async () => {
			await decorateTitle();
		});
	}

	if (urlInTitle || includeTabMarkers) {
		mutationObserver ??= new MutationObserver(throttledMutationCallback);

		mutationObserver.observe(document, {
			attributes: true,
			childList: true,
			subtree: true,
		});
	}
}
