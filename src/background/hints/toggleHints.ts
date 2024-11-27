import { retrieve, store } from "../../common/storage/storage";
import { type ToggleLevel } from "../../typings/Action";
import { sendMessage } from "../messaging/backgroundMessageBroker";
import { getCurrentTab } from "../tabs/getCurrentTab";

export async function toggleHintsGlobal() {
	const hintsToggleGlobal = await retrieve("hintsToggleGlobal");
	const newStatus = !hintsToggleGlobal;
	await store("hintsToggleGlobal", newStatus);
	return newStatus;
}

export async function updateHintsToggle(level: ToggleLevel, enable?: boolean) {
	const currentTab = await getCurrentTab();
	const { host, origin, pathname } = new URL(currentTab.url!);

	switch (level) {
		case "everywhere": {
			if (enable === undefined) {
				await store("hintsToggleGlobal", true);
				await store("hintsToggleTabs", new Map());
				await store("hintsToggleHosts", new Map());
				await store("hintsTogglePaths", new Map());
				await sendMessage("updateNavigationToggle", {
					enable,
				});
			}

			break;
		}

		case "now": {
			await sendMessage("updateNavigationToggle", {
				enable,
			});
			break;
		}

		case "global": {
			await store("hintsToggleGlobal", enable ?? true);
			break;
		}

		case "tab": {
			const hintsToggleTabs = await retrieve("hintsToggleTabs");
			if (enable === undefined) {
				hintsToggleTabs.delete(currentTab.id!);
			} else {
				hintsToggleTabs.set(currentTab.id!, enable);
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
	}
}
