import { assertDefined } from "../../typings/TypingUtils";
import { sendRequestToCurrentTab } from "../messaging/sendRequestToCurrentTab";
import { getCurrentTab } from "../utils/getCurrentTab";
import { retrieve, store } from "../../common/storage";
import { RangoActionUpdateToggles } from "../../typings/RangoAction";

export async function toggleHintsGlobal() {
	const hintsToggleGlobal = await retrieve("hintsToggleGlobal");
	await store("hintsToggleGlobal", !hintsToggleGlobal);
}

export async function updateHintsToggle(
	level: RangoActionUpdateToggles["arg"],
	enable?: boolean
) {
	const currentTab = await getCurrentTab();
	assertDefined(currentTab.url);
	const { host, origin, pathname } = new URL(currentTab.url);

	switch (level) {
		case "everywhere":
			if (enable === undefined) {
				await store("hintsToggleGlobal", true);
				await store("hintsToggleTabs", new Map());
				await store("hintsToggleHosts", new Map());
				await store("hintsTogglePaths", new Map());
				await sendRequestToCurrentTab({
					type: "updateNavigationToggle",
					enable,
				});
			}

			break;

		case "now": {
			await sendRequestToCurrentTab({
				type: "updateNavigationToggle",
				enable,
			});
			break;
		}

		case "global":
			await store("hintsToggleGlobal", enable === undefined ? true : enable);
			break;

		case "tab": {
			const hintsToggleTabs = await retrieve("hintsToggleTabs");
			assertDefined(currentTab.id);
			if (enable === undefined) {
				hintsToggleTabs.delete(currentTab.id);
			} else {
				hintsToggleTabs.set(currentTab.id, enable);
			}

			await store("hintsToggleTabs", hintsToggleTabs);

			break;
		}

		case "host": {
			const hintsToggleHosts = await retrieve("hintsToggleHosts");
			if (host) {
				if (enable === undefined) {
					hintsToggleHosts.delete(host);
				} else {
					hintsToggleHosts.set(host, enable);
				}
			}

			await store("hintsToggleHosts", hintsToggleHosts);

			break;
		}

		case "page": {
			const hintsTogglePaths = await retrieve("hintsTogglePaths");
			if (origin && pathname) {
				if (enable === undefined) {
					hintsTogglePaths.delete(origin + pathname);
				} else {
					hintsTogglePaths.set(origin + pathname, enable);
				}
			}

			await store("hintsTogglePaths", hintsTogglePaths);

			break;
		}

		default:
			break;
	}
}
