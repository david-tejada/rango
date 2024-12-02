import { onMessage, sendMessage } from "../messaging/contentMessageBroker";
import { getSetting, onSettingChange } from "../settings/settingsManager";
import { getToggles } from "../settings/toggles";
import { isMainFrame } from "./contentScriptContext";

let lastUrlAdded: string | undefined;
let titleBeforeDecoration: string | undefined;
let titleAfterDecoration: string | undefined;

/**
 * Update the title decorations. Add the necessary decorations (tab marker and
 * url) or remove them according to settings.
 */
export async function updateTitleDecorations() {
	if (!isMainFrame()) return;

	// Sometimes the document.title is modified by the page itself starting with
	// the previous document.title. For example, in Bandcamp when the play button
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

	// Remove decorations. Handle settings having changed and removing some
	// decoration that is not needed anymore. Also make extra sure we don't
	// duplicate the prefix or suffix. Prevents decorations from being added
	// multiple times when the extension is updated and in some other difficult to
	// reproduce situations.
	removeDecorations(prefix);

	if (document.title !== titleAfterDecoration) {
		titleBeforeDecoration = document.title;
	}

	document.title = prefix + titleBeforeDecoration! + suffix;

	if (suffix) lastUrlAdded = window.location.href;
	if (prefix || suffix) titleAfterDecoration = document.title;
}

export function removeDecorations(prefix?: string) {
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

async function getTitlePrefix() {
	if (!shouldIncludeTabMarkers()) return "";

	const tabMarker = await sendMessage("getTabMarker");
	const marker = getSetting("uppercaseTabMarkers")
		? tabMarker.toUpperCase()
		: tabMarker;

	return `${marker} | `;
}

function getTitleSuffix() {
	if (getSetting("urlInTitle")) {
		return ` - ${window.location.href}`;
	}

	return "";
}

export function getTitleBeforeDecoration() {
	return titleBeforeDecoration ?? document.title;
}

function shouldIncludeTabMarkers() {
	if (!getSetting("includeTabMarkers")) return false;

	const globalHintsDisabled = !getToggles().global;
	const hideMarkersWhenHintsOff = getSetting(
		"hideTabMarkersWithGlobalHintsOff"
	);

	return !(hideMarkersWhenHintsOff && globalHintsDisabled);
}

onMessage("tabDidUpdate", async ({ title }) => {
	// We ignore the instances after we decorate the title.
	if (title && title === titleAfterDecoration) return;

	await updateTitleDecorations();
});

onSettingChange(
	[
		"urlInTitle",
		"includeTabMarkers",
		"uppercaseTabMarkers",
		"hideTabMarkersWithGlobalHintsOff",
	],
	updateTitleDecorations
);

onSettingChange("hintsToggleGlobal", async () => {
	if (getSetting("hideTabMarkersWithGlobalHintsOff")) {
		await updateTitleDecorations();
	}
});
