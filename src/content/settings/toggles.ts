import { getTabId } from "../setup/contentScriptContext";
import { getCachedSettingAll } from "./cacheSettings";

let navigationToggle: boolean | undefined;

export function setNavigationToggle(enable: boolean | undefined) {
	navigationToggle = enable;
}

export function getToggles() {
	const {
		hintsToggleGlobal,
		hintsToggleHosts,
		hintsTogglePaths,
		hintsToggleTabs,
	} = getCachedSettingAll();

	const tabSwitch = hintsToggleTabs.get(getTabId());
	const hostSwitch = hintsToggleHosts.get(window.location.host);
	const pathSwitch = hintsTogglePaths.get(
		window.location.origin + window.location.pathname
	);

	return {
		computed:
			navigationToggle ??
			pathSwitch ??
			hostSwitch ??
			tabSwitch ??
			hintsToggleGlobal,
		navigation: navigationToggle,
		path: pathSwitch,
		host: hostSwitch,
		tab: tabSwitch,
		global: hintsToggleGlobal,
	};
}
