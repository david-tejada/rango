import Fuse from "fuse.js";
import { settings } from "../../common/settings/settings";
import { notify } from "../feedback/notify";
import { getSetting } from "../settings/settingsManager";
import { getMainScrollable, getScrollBehavior } from "./scroll";

export async function storeScrollPosition(name: string) {
	const scrollContainer = getMainScrollable("vertical");

	if (!scrollContainer) {
		await notify.error(`Unable to find scroll container`);
		return;
	}

	const { scrollTop } = scrollContainer;

	const scrollPositions = getSetting("customScrollPositions");
	const scrollPositionsForCurrentPage =
		scrollPositions.get(location.origin + location.pathname) ??
		new Map<string, number>();

	scrollPositionsForCurrentPage.set(name, scrollTop);

	scrollPositions.set(
		location.origin + location.pathname,
		scrollPositionsForCurrentPage
	);
	await settings.set("customScrollPositions", scrollPositions);

	await notify.success(`Scroll position "${name}" saved`);
}

export async function scrollToPosition(name: string) {
	const scrollContainer = getMainScrollable("vertical");

	const scrollPositions = getSetting("customScrollPositions");
	const scrollPositionsForCurrentPage =
		scrollPositions.get(location.origin + location.pathname) ??
		new Map<string, number>();

	const scrollPositionsArray = [...scrollPositionsForCurrentPage].map(
		([name, number]) => ({ name, number })
	);

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
