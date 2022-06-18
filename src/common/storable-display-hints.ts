import { DisplayHints, StorableDisplayHints } from "../typing/types";

export function displayHintsToStorable(
	displayHints: DisplayHints
): StorableDisplayHints {
	const { global, tabs, hosts, paths } = displayHints;
	// console.log({ global, tabs, hosts, paths });
	return {
		global,
		tabs: Array.from(tabs),
		hosts: Array.from(hosts),
		paths: Array.from(paths),
	};
}

export function displayHintsFromStorable(
	storableDisplayHints: StorableDisplayHints
): DisplayHints {
	const { global, tabs, hosts, paths } = storableDisplayHints;
	// console.log({ global, tabs, hosts, paths });
	return {
		global,
		tabs: new Map(tabs),
		hosts: new Map(hosts),
		paths: new Map(paths),
	};
}
