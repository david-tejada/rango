import browser from "webextension-polyfill";
import { hintsToggleFromStorable } from "../../common/HintsToggleFromStorable";
import { StorableHintsToggle } from "../../typings/RangoOptions";

let navigationToggle: boolean | undefined;

export function setNavigationToggle(toggle: boolean) {
	navigationToggle = toggle;
}

export async function shouldDisplayHints(): Promise<boolean> {
	if (document.body.contentEditable === "true") return false;

	if (navigationToggle !== undefined) {
		return navigationToggle;
	}

	let { hintsToggle: storableHintsToggle } = (await browser.storage.local.get(
		"hintsToggle"
	)) as Record<string, StorableHintsToggle>;

	// This is stored when the extension first runs, so it shouldn't be undefined.
	// But it is undefined when running tests. This way we also make extra sure.
	if (!storableHintsToggle) {
		storableHintsToggle = { global: true, tabs: [], hosts: [], paths: [] };
		await browser.storage.local.set({ hintsToggle: storableHintsToggle });
	}

	const hintsToggle = hintsToggleFromStorable(storableHintsToggle);
	const { tabs, hosts, paths } = hintsToggle;
	const { tabId } = (await browser.runtime.sendMessage({
		type: "getTabId",
	})) as { tabId: number };
	const tabSwitch = tabs.get(tabId);
	const hostSwitch = hosts.get(window.location.host);
	const pathSwitch = paths.get(
		window.location.origin + window.location.pathname
	);

	if (pathSwitch !== undefined) {
		return pathSwitch;
	}

	if (hostSwitch !== undefined) {
		return hostSwitch;
	}

	if (tabSwitch !== undefined) {
		return tabSwitch;
	}

	return hintsToggle.global;
}
