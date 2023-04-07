import { assertDefined } from "../../typings/TypingUtils";
import { sendRequestToCurrentTab } from "../messaging/sendRequestToCurrentTab";
import { getCurrentTabId } from "../utils/getCurrentTab";
import { retrieve, store } from "../../common/storage";

export async function toggleHints(level: string, enable?: boolean) {
	const currentTabId = await getCurrentTabId();
	const [host, origin, pathname] = (await sendRequestToCurrentTab({
		type: "getLocation",
	})) as string[];

	switch (level) {
		case "everywhere":
			if (enable === undefined) {
				await store("hintsToggleGlobal", true);
				await store("hintsToggleTabs", new Map());
				await store("hintsToggleHosts", new Map());
				await store("hintsTogglePaths", new Map());
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
				await store("hintsToggleGlobal", enable);
			}

			break;

		case "tab": {
			const hintsToggleTabs = await retrieve("hintsToggleTabs");
			if (enable === undefined) {
				hintsToggleTabs.delete(currentTabId);
			} else {
				hintsToggleTabs.set(currentTabId, enable);
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
