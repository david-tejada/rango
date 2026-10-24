import { onMessage, sendMessage } from "../messaging/messageHandler";
import { settingsSync } from "../settings/settingsSync";
import { getToggles } from "../settings/toggles";
import { isCurrentTab, isMainFrame } from "./contentScriptContext";

let lastUrlAdded: string | undefined;

/**
 * Tab marker prefix currently in the title, if any.
 */
let lastPrefixAdded: string | undefined;

/**
 * Number of the most recent call to `updateTitleDecorations`. A call that
 * awaited while a newer one started stops, so it can't overwrite the newer
 * result with a stale one.
 */
let latestUpdate = 0;

/**
 * Last title before any decorations were added.
 */
let lastUndecoratedTitle = document.title;

/**
 * Last title including possible decorations. It might be the same as
 * `lastUndecoratedTitle` if no decorations were added.
 */
let lastDecoratedTitle = document.title;

/**
 * Title used in place of an empty `document.title` the last time we decorated
 * it, and the URL it was used for.
 */
let lastFallback: { title: string; url: string } | undefined;

/**
 * Update the title decorations. Add the necessary decorations (tab marker and
 * url) or remove them according to settings.
 */
export async function updateTitleDecorations() {
	if (!isMainFrame()) return;

	const update = ++latestUpdate;
	const isCurrentTab_ = await isCurrentTab();
	if (update !== latestUpdate) return;

	// Avoid adding decorations for the current tab if the `document.title` is
	// empty. This can happen when the page is loading or we are dealing with a
	// PDF or similar file.
	if (isCurrentTab_ && document.title === "") return;

	// Remove decorations when the tab becomes the current tab for documents
	// without title. This is only necessary for PDFs or similar files that have
	// an empty `document.title`. If the title is no longer the one we set, the
	// page has given itself a title and we decorate that one instead.
	if (
		isCurrentTab_ &&
		lastUndecoratedTitle === "" &&
		document.title === lastDecoratedTitle
	) {
		document.title = "";
		lastDecoratedTitle = "";
		return;
	}

	// Sometimes the `document.title` is modified by the page itself starting from
	// the previous `document.title`. For example, in Bandcamp when the play
	// button is clicked, "▶︎ " is added to the front of the title. After the track
	// is stopped the first three characters of the title are removed. Any title
	// includes an empty title, so that case doesn't count. Neither does a title
	// we didn't decorate, since the page's new title is then its own title and
	// `lastUndecoratedTitle` needs to follow it.
	if (
		lastDecoratedTitle !== "" &&
		lastDecoratedTitle !== lastUndecoratedTitle &&
		document.title !== lastDecoratedTitle &&
		document.title.includes(lastDecoratedTitle)
	) {
		lastDecoratedTitle = document.title;
		return;
	}

	// The current tab doesn't need a tab marker, since tab markers are for
	// targeting other tabs. Browsers use the current tab's title as the default
	// filename when saving the page or dragging its URL to create a shortcut, so
	// a marker there would end up in the filename.
	const prefix = isCurrentTab_ ? "" : await getTitlePrefix();
	if (update !== latestUpdate) return;
	const suffix = getTitleSuffix();

	// Remove decorations. Handle settings having changed and removing any
	// decorations that are not needed anymore. Also make extra sure we don't
	// duplicate the prefix or suffix. Prevents decorations from being added
	// multiple times when the extension is updated and in some other difficult to
	// reproduce situations.
	lastUndecoratedTitle = await removeDecorations(document.title);

	// A fallback title we added earlier isn't part of the document's own title.
	// Keeping `lastUndecoratedTitle` empty lets us clear the title again when the
	// tab becomes the current tab.
	if (lastUndecoratedTitle === lastFallback?.title) lastUndecoratedTitle = "";

	// Assigning a title to a document without one hides the title the browser
	// shows in its place (usually the URL). Use that title instead of leaving
	// only the decorations.
	let title = lastUndecoratedTitle;
	if (!title && (prefix || suffix)) {
		const titleBeforeFallback = document.title;
		title = await getFallbackTitle();
		if (update !== latestUpdate) return;

		// The page might have set its own title while we waited. The
		// `tabDidUpdate` for that change will decorate it, and assigning here would
		// overwrite it.
		if (document.title !== titleBeforeFallback) return;

		lastFallback = { title, url: location.href };
	}

	// It's important to first assign to `document.title` because this assignment
	// might perform some changes, like removing excess contiguous space
	// characters.
	document.title = prefix + title + suffix;
	lastDecoratedTitle = document.title;
	lastPrefixAdded = prefix;

	if (suffix) lastUrlAdded = location.href;
}

/**
 * The title the browser shows for a tab whose document has no title, or the
 * URL without its scheme if the browser doesn't provide one.
 */
async function getFallbackTitle() {
	const urlWithoutScheme = location.href.replace(/^[a-z]+:\/\//i, "");

	// Once we decorate the title, the tab title is our own decorated title and
	// no longer the browser's fallback. Reuse the fallback while the URL stays
	// the same, and use the URL when it changes.
	if (document.title !== "") {
		return lastFallback?.url === location.href
			? lastFallback.title
			: urlWithoutScheme;
	}

	try {
		const tabTitle = await sendMessage("getTabTitle");
		// The tab title might still include our decorations if the browser hasn't
		// caught up with us clearing `document.title`.
		const title = tabTitle ? await removeDecorations(tabTitle) : "";
		return title || urlWithoutScheme;
	} catch (error: unknown) {
		// The title is cosmetic, so a failed message shouldn't stop the content
		// script from initializing.
		console.error(error);
		return urlWithoutScheme;
	}
}

async function removeDecorations(title: string) {
	const possibleSuffix = ` - ${lastUrlAdded ?? location.href}`;
	if (title.endsWith(possibleSuffix)) {
		title = title.slice(0, -possibleSuffix.length);
	}

	// A page that builds its title from the decorated one, like adding a
	// notification count in front of it, leaves our tab marker in the middle.
	if (lastPrefixAdded) title = title.replace(lastPrefixAdded, "");

	// Remove tab marker prefix (matches both "A|" and "A | " formats)
	return title.replace(/^[a-z]{1,2} ?\| ?/i, "");
}

async function getTitlePrefix() {
	if (!(await shouldIncludeTabMarkers())) return "";

	const tabMarker = await sendMessage("getTabMarker");
	if (!tabMarker) return "";

	const marker = settingsSync.get("uppercaseTabMarkers")
		? tabMarker.toUpperCase()
		: tabMarker;

	const delimiter = settingsSync.get("useCompactTabMarkerDelimiter")
		? "|"
		: " | ";
	return `${marker}${delimiter}`;
}

function getTitleSuffix() {
	if (settingsSync.get("urlInTitle")) {
		return ` - ${location.href}`;
	}

	return "";
}

/**
 * The document's title without our decorations. For a document without a
 * title, the title the browser shows in its place, so commands that copy the
 * title don't end up with an empty one.
 */
export async function getTitleBeforeDecoration() {
	return lastUndecoratedTitle || getFallbackTitle();
}

async function shouldIncludeTabMarkers() {
	if (!settingsSync.get("includeTabMarkers")) return false;

	const globalHintsDisabled = !getToggles().global;
	const hideMarkersWhenHintsOff = settingsSync.get(
		"hideTabMarkersWithGlobalHintsOff"
	);

	return !(hideMarkersWhenHintsOff && globalHintsDisabled);
}

onMessage("tabDidUpdate", async ({ title }) => {
	// We ignore the instances after we decorate the title. Note: `title` is not
	// necessarily the same as `document.title`. For example, with PDFs,
	// `document.title` is usually empty while title is the title of the tab.
	if (title && document.title === lastDecoratedTitle) return;

	await updateTitleDecorations();
});

onMessage("currentTabChanged", async () => {
	await updateTitleDecorations();
});

settingsSync.onChange(
	[
		"urlInTitle",
		"includeTabMarkers",
		"uppercaseTabMarkers",
		"hideTabMarkersWithGlobalHintsOff",
		"useCompactTabMarkerDelimiter",
	],
	updateTitleDecorations
);

settingsSync.onChange("hintsToggleGlobal", async () => {
	if (settingsSync.get("hideTabMarkersWithGlobalHintsOff")) {
		await updateTitleDecorations();
	}
});
