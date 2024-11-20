import { getTargetFromLabels } from "../../common/target/targetConversion";
import {
	type ActionMap,
	type ActionV1,
	type ActionV2,
	type ActionWithElementTarget,
	type LocationProperty,
	type ToggleLevel,
} from "../../typings/Action";
import { type Command, type CommandV2 } from "../../typings/Command";
import { getTargetFromTabHints } from "../tabs/target";

function upgradeAction(action: ActionV1): ActionV2<keyof ActionMap> {
	const { type: name, target, ...rest } = action;

	const { arg, arg2, arg3 } = rest;

	switch (name) {
		case "closeNextTabsInWindow":
		case "closePreviousTabsInWindow":
		case "closeTabsLeftEndInWindow":
		case "closeTabsRightEndInWindow": {
			return { name, amount: arg as number };
		}

		case "cycleTabsByText": {
			return { name, step: arg as number };
		}

		case "focusTabByText": {
			return { name, text: arg as string };
		}

		case "openPageInNewTab":
		case "focusOrCreateTabByUrl": {
			return { name, url: arg as string };
		}

		case "activateTab":
		case "closeTab":
		case "muteTab":
		case "unmuteTab": {
			return {
				name,
				target: target ? getTargetFromTabHints(target) : undefined,
			};
		}

		case "copyLocationProperty": {
			return { name, property: arg as LocationProperty };
		}

		case "runActionOnReference": {
			return {
				name: arg as ActionWithElementTarget,
				target: {
					type: "primitive",
					mark: { type: "elementReference", value: arg2! },
				},
			};
		}

		case "runActionOnTextMatchedElement": {
			return {
				name: arg as ActionWithElementTarget,
				target: {
					type: "primitive",
					mark: {
						type: "fuzzyText",
						value: arg2!,
						// There was a bug in rango-talon where this was not set if it was false
						prioritizeViewport: arg3 ?? false,
					},
				},
			};
		}

		case "scrollDownAtElement":
		case "scrollDownLeftAside":
		case "scrollDownPage":
		case "scrollDownRightAside":
		case "scrollLeftAtElement":
		case "scrollLeftPage":
		case "scrollRightAtElement":
		case "scrollRightPage":
		case "scrollUpAtElement":
		case "scrollUpLeftAside":
		case "scrollUpPage":
		case "scrollUpRightAside": {
			return {
				name,
				target: target ? getTargetFromLabels(target) : undefined,
				factor: arg as number,
			};
		}

		case "storeScrollPosition":
		case "scrollToPosition": {
			return {
				name,
				positionName: arg as string,
			};
		}

		case "disableHints":
		case "enableHints":
		case "resetToggleLevel": {
			return {
				name,
				level: arg as ToggleLevel,
			};
		}

		case "saveReference": {
			return {
				name,
				target: target ? getTargetFromLabels(target) : undefined,
				referenceName: arg as string,
			};
		}

		case "removeReference":
		case "saveReferenceForActiveElement": {
			return {
				name,
				referenceName: arg as string,
			};
		}

		default: {
			return {
				name,
				target: target ? getTargetFromLabels(target) : undefined,
				...rest,
			};
		}
	}
}

export function upgradeCommand(command: Command): CommandV2<keyof ActionMap> {
	if (command.version === 2) return command;

	if (command.version === 1) {
		return {
			...command,
			version: 2,
			action: upgradeAction(command.action),
		};
	}

	return command;
}
