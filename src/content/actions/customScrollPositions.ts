import Fuse from "fuse.js";
import { settings } from "../../common/settings/settings";
import { notify } from "../feedback/notify";
import { settingsSync } from "../settings/settingsSync";
import { getMainScrollable, getScrollBehavior } from "./scroll";

export async function storeScrollPosition(name: string) {
	const scrollContainer = getMainScrollable("vertical");

	if (!scrollContainer) {
		await notify.error(`Unable to find scroll container`);
		return;
	}

	const { scrollTop } = scrollContainer;

	const scrollPositions = settingsSync.get("customScrollPositions");
	const scrollPositionsForCurrentPage =
		scrollPositions[location.origin + location.pathname] ?? {};

	scrollPositionsForCurrentPage[name] = scrollTop;

	scrollPositions[location.origin + location.pathname] =
		scrollPositionsForCurrentPage;

	await settings.set("customScrollPositions", scrollPositions);

	await notify.success(`Scroll position "${name}" saved`);
}

export async function scrollToPosition(name: string) {
	const scrollContainer = getMainScrollable("vertical");

	const scrollPositions = settingsSync.get("customScrollPositions");
	const scrollPositionsForCurrentPage =
		scrollPositions[location.origin + location.pathname] ?? {};

	const scrollPositionsArray = Object.entries(
		scrollPositionsForCurrentPage
	).map(([name, number]) => ({ name, number }));

	const fuse = new Fuse(scrollPositionsArray, {
		keys: ["name"],
	});

	const results = fuse.search(name);
	const position = results[0]?.item.number;

	if (!position) {
		await notify.error(`No scroll position matching "${name}"`);
		return;
	}

	scrollContainer?.scrollTo({ top: position, behavior: getScrollBehavior() });
}
