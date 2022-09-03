import { HintsToggle, StorableHintsToggle } from "../typings/RangoOptions";

export function hintsToggleToStorable(
	hintsToggle: HintsToggle
): StorableHintsToggle {
	const { global, tabs, hosts, paths } = hintsToggle;
	return {
		global,
		tabs: Array.from(tabs),
		hosts: Array.from(hosts),
		paths: Array.from(paths),
	};
}

export function hintsToggleFromStorable(
	storableHintsToggle: StorableHintsToggle
): HintsToggle {
	const { global, tabs, hosts, paths } = storableHintsToggle;
	return {
		global,
		tabs: new Map(tabs),
		hosts: new Map(hosts),
		paths: new Map(paths),
	};
}
