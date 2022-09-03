import browser from "webextension-polyfill";
import { hintsToggleFromStorable } from "../../common/HintsToggleFromStorable";
import { StorableHintsToggle } from "../../typings/RangoOptions";
import { assertDefined } from "../../typings/TypingUtils";

let navigationToggle: boolean | undefined;

export function setNavigationToggle(toggle: boolean) {
	navigationToggle = toggle;
}

export async function shouldDisplayHints(): Promise<boolean> {
	if (navigationToggle !== undefined) {
		return navigationToggle;
	}

	const { hintsToggle: storableHintsToggle } = (await browser.storage.local.get(
		"hintsToggle"
	)) as Record<string, StorableHintsToggle>;
	assertDefined(storableHintsToggle);
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
