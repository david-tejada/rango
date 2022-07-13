import {
	hintsToggleFromStorable,
	hintsToggleToStorable,
} from "../../common/HintsToggleFromStorable";
import { getStored, setStored } from "../../lib/getStored";
import { StorableHintsToggle } from "../../typings/RangoOptions";
import { ResponseWithLocation } from "../../typings/ScriptResponse";
import { assertDefined } from "../../typings/TypingUtils";
import { sendRequestToAllTabs } from "../messaging/sendRequestToAllTabs";
import { sendRequestToCurrentTab } from "../messaging/sendRequestToCurrentTab";
import { getCurrentTabId } from "../utils/getCurrentTab";

export async function toggleHints(level: string, enable?: boolean) {
	const storableHintsToggle = (await getStored(
		"hintsToggle"
	)) as StorableHintsToggle;
	const hintsToggle = hintsToggleFromStorable(storableHintsToggle);
	const currentTabId = await getCurrentTabId();
	const { host, origin, pathname } = (await sendRequestToCurrentTab({
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
			await sendRequestToCurrentTab({
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
			if (enable === undefined) {
				hintsToggle.tabs.delete(currentTabId);
			} else {
				hintsToggle.tabs.set(currentTabId, enable);
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
