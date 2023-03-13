import browser from "webextension-polyfill";
import { storeIfUndefined, retrieve } from "../../common/storage";

let navigationToggle: boolean | undefined;

export function setNavigationToggle(toggle: boolean) {
	navigationToggle = toggle;
}

export async function shouldDisplayHints(): Promise<boolean> {
	if (navigationToggle !== undefined) {
		return navigationToggle;
	}

	// This is initialized when the extension first runs. But it is undefined when
	// running tests. This way we also make extra sure.
	await storeIfUndefined("hintsToggleGlobal", true);

	const hintsToggleGlobal = await retrieve("hintsToggleGlobal");
	const hintsToggleHosts = await retrieve("hintsToggleHosts");
	const hintsTogglePaths = await retrieve("hintsTogglePaths");
	const hintsToggleTabs = await retrieve("hintsToggleTabs");

	const { tabId } = (await browser.runtime.sendMessage({
		type: "getTabId",
	})) as { tabId: number };
	const tabSwitch = hintsToggleTabs.get(tabId);
	const hostSwitch = hintsToggleHosts.get(window.location.host);
	const pathSwitch = hintsTogglePaths.get(
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

	return hintsToggleGlobal;
}
