import { onMessage, sendMessage } from "../messaging/messageHandler";
import { settingsSync } from "../settings/settingsSync";
import { getToggles } from "../settings/toggles";
import { isCurrentTab, isMainFrame } from "./contentScriptContext";

let lastUrlAdded: string | undefined;

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
 * Update the title decorations. Add the necessary decorations (tab marker and
 * url) or remove them according to settings.
 */
export async function updateTitleDecorations() {
	if (!isMainFrame()) return;

	const isCurrentTab_ = await isCurrentTab();

	// Avoid adding decorations for the current tab if the `document.title` is
	// empty. This can happen when the page is loading or we are dealing with a
	// PDF or similar file.
	if (isCurrentTab_ && document.title === "") return;

	// Remove decorations when the tab becomes the current tab for documents
	// without title. This is only necessary for PDFs or similar files that have
	// an empty `document.title`.
	if (isCurrentTab_ && lastUndecoratedTitle === "") {
		document.title = "";
		lastDecoratedTitle = "";
		return;
	}

	// Sometimes the `document.title` is modified by the page itself starting from
	// the previous `document.title`. For example, in Bandcamp when the play
	// button is clicked, "▶︎ " is added to the front of the title. After the track
	// is stopped the first three characters of the title are removed.
	if (
		document.title !== lastDecoratedTitle &&
		document.title.includes(lastDecoratedTitle)
	) {
		lastDecoratedTitle = document.title;
		return;
	}

	const prefix = await getTitlePrefix();
	const suffix = getTitleSuffix();

	// Remove decorations. Handle settings having changed and removing any
	// decorations that are not needed anymore. Also make extra sure we don't
	// duplicate the prefix or suffix. Prevents decorations from being added
	// multiple times when the extension is updated and in some other difficult to
	// reproduce situations.
	lastUndecoratedTitle = await removeDecorations(document.title);

	// It's important to first assign to `document.title` because this assignment
	// might perform some changes, like removing excess contiguous space
	// characters.
	document.title = prefix + lastUndecoratedTitle + suffix;
	lastDecoratedTitle = document.title;

	if (suffix) lastUrlAdded = location.href;
}

async function removeDecorations(title: string) {
	const possibleSuffix = ` - ${lastUrlAdded ?? location.href}`;
	if (title.endsWith(possibleSuffix)) {
		title = title.slice(0, -possibleSuffix.length);
	}

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

export function getTitleBeforeDecoration() {
	return lastUndecoratedTitle;
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
