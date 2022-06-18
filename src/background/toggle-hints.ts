import {
	hintsToggleFromStorable,
	hintsToggleToStorable,
} from "../common/storable-display-hints";
import { getStored, setStored } from "../lib/storage";
import { ResponseWithLocation, StorableHintsToggle } from "../typing/types";
import { assertDefined } from "../typing/typing-utils";
import {
	getActiveTab,
	sendRequestToActiveTab,
	sendRequestToAllTabs,
} from "./tabs-messaging";

export async function toggleHints(level: string, enable?: boolean) {
	const storableHintsToggle = (await getStored(
		"hintsToggle"
	)) as StorableHintsToggle;
	const hintsToggle = hintsToggleFromStorable(storableHintsToggle);
	const activeTab = await getActiveTab();
	assertDefined(activeTab);
	assertDefined(activeTab.id);
	const { host, origin, pathname } = (await sendRequestToActiveTab({
		type: "getLocation",
	})) as ResponseWithLocation;

	switch (level) {
		case "everywhere":
			if (enable === undefined) {
				hintsToggle.global = true;
				hintsToggle.tabs = new Map();
				hintsToggle.hosts = new Map();
				hintsToggle.paths = new Map();
			}

			break;

		case "now": {
			assertDefined(enable);
			const requestType = enable
				? "enableHintsNavigation"
				: "disableHintsNavigation";
			await sendRequestToActiveTab({
				type: requestType,
			});
			break;
		}

		case "global":
			if (enable !== undefined) {
				hintsToggle.global = enable;
			}

			break;

		case "tab":
			if (activeTab?.id) {
				if (enable === undefined) {
					hintsToggle.tabs.delete(activeTab.id);
				} else {
					hintsToggle.tabs.set(activeTab.id, enable);
				}
			}

			break;

		case "host":
			if (host) {
				if (enable === undefined) {
					hintsToggle.hosts.delete(host);
				} else {
					hintsToggle.hosts.set(host, enable);
				}
			}

			break;

		case "page":
			if (origin && pathname) {
				if (enable === undefined) {
					hintsToggle.paths.delete(origin + pathname);
				} else {
					hintsToggle.paths.set(origin + pathname, enable);
				}
			}

			break;

		default:
			break;
	}

	await setStored({ hintsToggle: hintsToggleToStorable(hintsToggle) });
	await sendRequestToAllTabs({ type: "fullHintsUpdate" });
}
